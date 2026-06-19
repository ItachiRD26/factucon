import { NextRequest, NextResponse } from 'next/server';
import { createSale } from '@/lib/sales/create-sale';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyId, cashierId, cashierName,
      items, subtotal, tax, total,
      paymentMethod, amountPaid, change,
      ncfType, customer,
    } = body;

    if (!companyId || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const { saleId, saleNumber, dgii } = await createSale(companyId, {
      cashierId, cashierName, items, subtotal, tax, total,
      paymentMethod, amountPaid, change, ncfType, customer,
    });

    return NextResponse.json({ ok: true, saleId, saleNumber, dgii });
  } catch (error: any) {
    console.error('Sale error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
