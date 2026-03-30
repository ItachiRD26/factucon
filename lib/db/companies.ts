import {
  collection, doc, getDocs, getDoc,
  setDoc, updateDoc, query, where,
  serverTimestamp, Timestamp, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Company, SubscriptionStatus } from '@/lib/types';

const COL = 'companies';

// ── Serializar / deserializar ─────────────────────────────────
function fromFirestore(id: string, data: any): Company {
  return {
    ...data,
    id,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    subscription: {
      ...data.subscription,
      currentPeriodStart: data.subscription?.currentPeriodStart?.toDate?.() ?? new Date(),
      currentPeriodEnd:   data.subscription?.currentPeriodEnd?.toDate?.()   ?? new Date(),
      trialEndsAt:        data.subscription?.trialEndsAt?.toDate?.()        ?? null,
      blockedAt:          data.subscription?.blockedAt?.toDate?.()          ?? null,
      inactiveAt:         data.subscription?.inactiveAt?.toDate?.()         ?? null,
    },
  } as Company;
}

// ── Obtener todas las empresas de un usuario ──────────────────
export async function getCompaniesByOwner(ownerId: string): Promise<Company[]> {
  const q = query(
    collection(db, COL),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore(d.id, d.data()));
}

// ── Obtener una empresa por ID ────────────────────────────────
export async function getCompany(id: string): Promise<Company | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return fromFirestore(snap.id, snap.data());
}

// ── Crear empresa (desde el wizard) ──────────────────────────
export async function createCompany(
  data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Company> {
  const id  = `${data.slug}-${Date.now()}`;
  const now = serverTimestamp();

  const trial = new Date();
  trial.setDate(trial.getDate() + 14);
  const periodEnd = new Date(trial);

  const company: any = {
    ...data,
    id,
    subscription: {
      status:             'trial' as SubscriptionStatus,
      planPrice:          data.subscription?.planPrice ?? 800,
      currentPeriodStart: Timestamp.fromDate(new Date()),
      currentPeriodEnd:   Timestamp.fromDate(periodEnd),
      trialEndsAt:        Timestamp.fromDate(trial),
      reactivationFee:    500,
    },
    subdomain: { provisioned: false },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COL, id), company);
  return { ...company, id, createdAt: new Date(), updatedAt: new Date() };
}

// ── Actualizar estado de suscripción ──────────────────────────
export async function updateSubscriptionStatus(
  companyId: string,
  status: SubscriptionStatus
): Promise<void> {
  const updates: any = { 'subscription.status': status, updatedAt: serverTimestamp() };
  if (status === 'blocked')  updates['subscription.blockedAt']  = serverTimestamp();
  if (status === 'inactive') updates['subscription.inactiveAt'] = serverTimestamp();
  await updateDoc(doc(db, COL, companyId), updates);
}

// ── Marcar subdominio como provisionado ───────────────────────
export async function markSubdomainProvisioned(
  companyId: string,
  vercelDomainId: string
): Promise<void> {
  await updateDoc(doc(db, COL, companyId), {
    'subdomain.provisioned':   true,
    'subdomain.provisionedAt': serverTimestamp(),
    'subdomain.vercelDomainId': vercelDomainId,
    updatedAt: serverTimestamp(),
  });
}