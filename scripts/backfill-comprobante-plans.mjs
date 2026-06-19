// Backfill: agrega los nuevos campos de plan por comprobantes (planId,
// comprobanteLimit, comprobantesUsed, overageRate, pendingOverageDOP) a las
// empresas creadas ANTES de implementar el modelo de planes por volumen de
// comprobantes. Sin esto, app/portal/dashboard/empresa/[id]/facturacion
// crashea para esas empresas porque esos campos no existen en su documento.
//
// Uso:
//   node --env-file=.env scripts/backfill-comprobante-plans.mjs
//
// Seguro de correr varias veces — solo actualiza empresas cuyo
// subscription.comprobanteLimit aún no esté definido. El tier se asigna
// según subscription.planPrice, igual que en app/api/provision/route.ts.

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Debe coincidir con PLAN_TIERS en lib/types/index.ts
const PLAN_TIERS = [
  { id: 'starter',    comprobanteLimit: 500,  overageRate: 6, maxPrice: 1200 },
  { id: 'pro',        comprobanteLimit: 1000, overageRate: 5, maxPrice: 2200 },
  { id: 'business',   comprobanteLimit: 3000, overageRate: 4, maxPrice: 3800 },
  { id: 'enterprise', comprobanteLimit: 8000, overageRate: 3, maxPrice: Infinity },
];

function getPlanTier(monthlyPrice) {
  return PLAN_TIERS.find(t => monthlyPrice <= t.maxPrice) ?? PLAN_TIERS[PLAN_TIERS.length - 1];
}

const snap = await db.collection('companies').get();

let updated = 0;
for (const doc of snap.docs) {
  const sub = doc.data().subscription ?? {};
  if (sub.comprobanteLimit !== undefined) continue;

  const tier = getPlanTier(sub.planPrice ?? 0);
  await doc.ref.update({
    'subscription.planId':            tier.id,
    'subscription.comprobanteLimit':  tier.comprobanteLimit,
    'subscription.comprobantesUsed':  sub.comprobantesUsed ?? 0,
    'subscription.overageRate':       tier.overageRate,
    'subscription.pendingOverageDOP': sub.pendingOverageDOP ?? 0,
  });
  updated++;
  console.log(`✓ ${doc.id} (${doc.data().name ?? ''}) → plan ${tier.id} (${tier.comprobanteLimit} comprobantes/mes)`);
}

console.log(`\n${updated} empresa(s) actualizada(s) de ${snap.size}.`);
