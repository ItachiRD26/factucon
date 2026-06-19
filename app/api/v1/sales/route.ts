import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticateApiKey } from '@/lib/api/auth';
import { createSale, type CreateSalePayload } from '@/lib/sales/create-sale';

// POST /api/v1/sales — crea una venta para la empresa de la API key.
// Si la empresa tiene e-CF habilitado, la respuesta incluye el resultado de la emisión (`dgii`).
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: 'API key inválida o revocada' }, { status: 401 });

  try {
    const body = await req.json() as CreateSalePayload;
    if (!body.items?.length) {
      return NextResponse.json({ error: 'La venta debe tener al menos un ítem' }, { status: 400 });
    }

    const { saleId, saleNumber, dgii } = await createSale(auth.companyId, body);
    return NextResponse.json({ ok: true, saleId, saleNumber, dgii });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}

// GET /api/v1/sales?limit=20&cursor=<saleId> — lista paginada de ventas, más recientes primero.
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: 'API key inválida o revocada' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit  = Math.min(Number(searchParams.get('limit')) || 20, 100);
  const cursor = searchParams.get('cursor');

  let query = adminDb.collection('sales')
    .where('companyId', '==', auth.companyId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (cursor) {
    const cursorSnap = await adminDb.collection('sales').doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snap = await query.get();
  const sales = snap.docs.map(d => {
    const data = d.data();
    return {
      id:            d.id,
      saleNumber:    data.saleNumber,
      customer:      data.customer ?? null,
      items:         data.items ?? [],
      subtotal:      data.subtotal ?? 0,
      tax:           data.tax ?? 0,
      total:         data.total ?? 0,
      paymentMethod: data.paymentMethod ?? 'cash',
      createdAt:     data.createdAt?.toDate?.()?.toISOString() ?? null,
      dgii:          data.dgii ?? null,
    };
  });

  const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;
  return NextResponse.json({ sales, nextCursor });
}
