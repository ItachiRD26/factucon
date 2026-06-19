import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getPayPalSubscription } from '@/lib/paypal/client';

// POST { companyId, subscriptionId } — guarda el ID y estado de la
// suscripción de PayPal tras el regreso del checkout hospedado (approve).
export async function POST(req: NextRequest) {
  try {
    const { companyId, subscriptionId } = await req.json();
    if (!companyId || !subscriptionId) {
      return NextResponse.json({ error: 'Faltan companyId o subscriptionId' }, { status: 400 });
    }

    const subscription = await getPayPalSubscription(subscriptionId);
    const status = subscription.status ?? 'UNKNOWN';

    await adminDb.collection('companies').doc(companyId).update({
      'subscription.paypalSubscriptionId': subscriptionId,
      'subscription.paypalStatus':         status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, status });
  } catch (error: any) {
    console.error('Confirm subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
