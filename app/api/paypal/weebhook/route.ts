import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/paypal/verify-webhook';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { SubscriptionStatus } from '@/lib/types';
import { revisePayPalSubscriptionPrice } from '@/lib/paypal/client';
import { dopToUsd } from '@/lib/paypal/config';

// Este webhook corre sin sesión de Firebase Auth, así que actualiza
// "companies" con el SDK Admin (ignora firestore.rules) en vez del helper
// de lib/db/companies.ts (SDK cliente, requiere request.auth).
async function setSubscriptionStatus(companyId: string, status: SubscriptionStatus): Promise<void> {
  const updates: Record<string, unknown> = {
    'subscription.status': status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (status === 'blocked')  updates['subscription.blockedAt']  = FieldValue.serverTimestamp();
  if (status === 'inactive') updates['subscription.inactiveAt'] = FieldValue.serverTimestamp();
  await adminDb.collection('companies').doc(companyId).update(updates);
}

export async function POST(req: NextRequest) {
  const body    = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  // Verificar firma del webhook
  const valid = await verifyPayPalWebhook(headers, body);
  if (!valid) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  const event = JSON.parse(body);
  const { event_type, resource } = event;

  try {
    // Buscar empresa por subscription ID
    const snap = await adminDb
      .collection('companies')
      .where('subscription.paypalSubscriptionId', '==', resource.id)
      .get();

    if (snap.empty) {
      return NextResponse.json({ ok: true }); // No es un error, puede ser una prueba
    }

    const companyId = snap.docs[0].id;

    switch (event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await setSubscriptionStatus(companyId, 'active');
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await setSubscriptionStatus(companyId, 'canceled');
        break;

      case 'PAYMENT.SALE.COMPLETED': {
        // Pago exitoso → cerrar el ciclo que terminó (calcular excedente de
        // comprobantes, reiniciar el contador) y renovar el período.
        const sub = snap.docs[0].data().subscription ?? {};

        const used         = sub.comprobantesUsed ?? 0;
        const limit        = sub.comprobanteLimit ?? 0;
        const overageRate  = sub.overageRate ?? 0;
        const overageDOP   = Math.max(0, used - limit) * overageRate;
        const nextPriceDOP = (sub.planPrice ?? 0) + overageDOP;

        const nextPeriodEnd = new Date();
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

        await adminDb.collection('companies').doc(companyId).update({
          'subscription.status':             'active',
          'subscription.currentPeriodStart': FieldValue.serverTimestamp(),
          'subscription.currentPeriodEnd':   nextPeriodEnd,
          'subscription.blockedAt':          null,
          'subscription.comprobantesUsed':   0,
          'subscription.pendingOverageDOP':  overageDOP,
        });

        // Ajusta el precio del próximo ciclo en PayPal para incluir el
        // excedente (o regresarlo a la base si el ciclo anterior no tuvo).
        if (sub.paypalSubscriptionId) {
          try {
            await revisePayPalSubscriptionPrice(sub.paypalSubscriptionId, dopToUsd(nextPriceDOP));
          } catch (e) {
            console.error('No se pudo ajustar el precio del próximo ciclo en PayPal:', e);
          }
        }
        break;
      }

      case 'PAYMENT.SALE.DENIED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await setSubscriptionStatus(companyId, 'past_due');
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}