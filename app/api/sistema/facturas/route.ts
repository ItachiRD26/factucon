import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const snap = await adminDb
    .collection('sales')
    .where('companyId', '==', companyId)
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();

  const sales = snap.docs.map(d => {
    const data = d.data();
    return {
      id:            d.id,
      saleNumber:    data.saleNumber,
      ncfType:       data.ncfType ?? 'B02',
      clientName:    data.customer?.name    ?? null,
      clientRnc:     data.customer?.rnc     ?? null,
      items:         data.items             ?? [],
      subtotal:      data.subtotal          ?? 0,
      tax:           data.tax               ?? 0,
      total:         data.total             ?? 0,
      paymentMethod: data.paymentMethod     ?? 'cash',
      cashierName:   data.cashierName       ?? '',
      createdAt:     data.createdAt?.toDate?.()?.toISOString() ?? null,
      dgii:          data.dgii ?? null,
    };
  });

  return NextResponse.json({ sales });
}