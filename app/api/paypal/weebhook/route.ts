import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/paypal/verify-webhook';
import { updateSubscriptionStatus } from '@/lib/db/companies';
import { adminDb } from '@/lib/firebase/admin';

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
        await updateSubscriptionStatus(companyId, 'active');
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await updateSubscriptionStatus(companyId, 'canceled');
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Pago exitoso → renovar período
        const nextPeriodEnd = new Date();
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        await adminDb.collection('companies').doc(companyId).update({
          'subscription.status':           'active',
          'subscription.currentPeriodEnd': nextPeriodEnd,
          'subscription.blockedAt':        null,
        });
        break;

      case 'PAYMENT.SALE.DENIED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await updateSubscriptionStatus(companyId, 'past_due');
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}