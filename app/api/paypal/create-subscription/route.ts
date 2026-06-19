import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createPayPalSubscription } from '@/lib/paypal/client';
import { PAYPAL_PLAN_ID, dopToUsd } from '@/lib/paypal/config';

// POST { companyId } — crea la suscripción de PayPal para una empresa, con el
// precio override en USD calculado a partir de subscription.planPrice (RD$).
export async function POST(req: NextRequest) {
  try {
    const { companyId } = await req.json();
    if (!companyId) {
      return NextResponse.json({ error: 'Falta companyId' }, { status: 400 });
    }

    if (!PAYPAL_PLAN_ID) {
      return NextResponse.json(
        { error: 'PayPal no está configurado (falta PAYPAL_PLAN_ID)' },
        { status: 500 }
      );
    }

    const companySnap = await adminDb.collection('companies').doc(companyId).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const company  = companySnap.data()!;
    const priceUSD = dopToUsd(company.subscription?.planPrice ?? 0);

    const baseUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const returnUrl = `${baseUrl}/portal/dashboard/empresa/${companyId}/facturacion?paypal=success`;
    const cancelUrl = `${baseUrl}/portal/dashboard/empresa/${companyId}/facturacion?paypal=canceled`;

    const subscription = await createPayPalSubscription(PAYPAL_PLAN_ID, returnUrl, cancelUrl, priceUSD);
    const approveUrl   = subscription.links?.find((l: any) => l.rel === 'approve')?.href;

    return NextResponse.json({ subscriptionId: subscription.id, approveUrl });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
