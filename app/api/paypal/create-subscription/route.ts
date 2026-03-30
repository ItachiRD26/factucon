import { NextRequest, NextResponse } from 'next/server';
import { createPayPalSubscription } from '@/lib/paypal/client';

export async function POST(req: NextRequest) {
  try {
    const { planId, companyId } = await req.json();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const returnUrl = `${baseUrl}/portal/dashboard/empresa/${companyId}/facturacion?success=true`;
    const cancelUrl = `${baseUrl}/portal/dashboard/empresa/${companyId}/facturacion?canceled=true`;

    const subscription = await createPayPalSubscription(planId, returnUrl, cancelUrl);

    const approveLink = subscription.links?.find((l: any) => l.rel === 'approve')?.href;

    return NextResponse.json({
      subscriptionId: subscription.id,
      approveUrl: approveLink,
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}