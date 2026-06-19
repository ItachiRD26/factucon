import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticateApiKey } from '@/lib/api/auth';

// GET /api/v1/sales/{id} — detalle de una venta de la empresa de la API key, incluyendo su estado e-CF (`dgii`).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: 'API key inválida o revocada' }, { status: 401 });

  const { id } = await params;
  const snap = await adminDb.collection('sales').doc(id).get();
  if (!snap.exists || snap.data()?.companyId !== auth.companyId) {
    return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
  }

  const data = snap.data()!;
  return NextResponse.json({
    sale: {
      id:            snap.id,
      saleNumber:    data.saleNumber,
      customer:      data.customer ?? null,
      items:         data.items ?? [],
      subtotal:      data.subtotal ?? 0,
      tax:           data.tax ?? 0,
      total:         data.total ?? 0,
      paymentMethod: data.paymentMethod ?? 'cash',
      createdAt:     data.createdAt?.toDate?.()?.toISOString() ?? null,
      dgii:          data.dgii ?? null,
    },
  });
}
