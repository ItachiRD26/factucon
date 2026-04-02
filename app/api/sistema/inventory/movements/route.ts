import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const snap = await adminDb
    .collection('inventory_movements')
    .where('companyId', '==', companyId)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  const movements = snap.docs.map(d => {
    const data = d.data();
    return {
      id:            d.id,
      productId:     data.productId,
      productName:   data.productName,
      type:          data.type,
      quantity:      data.quantity,
      previousStock: data.previousStock,
      newStock:      data.newStock,
      reason:        data.reason ?? '',
      referenceType: data.referenceType,
      referenceId:   data.referenceId ?? null,
      createdBy:     data.createdBy,
      createdAt:     data.createdAt?.toDate?.()?.toISOString() ?? null,
    };
  });

  return NextResponse.json({ movements });
}