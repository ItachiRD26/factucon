import { NextResponse } from 'next/server';
import { getPayPalToken } from '@/lib/paypal/client';

export async function GET() {
  try {
    const token = await getPayPalToken();
    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}