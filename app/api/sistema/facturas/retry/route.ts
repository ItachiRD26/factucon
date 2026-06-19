import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { mapVentaToFactura, type VentaItemInput } from '@/lib/dgii/mapeo';
import { emitirECF } from '@/lib/dgii/emisor';

// POST /api/sistema/facturas/retry — { companyId, saleId }
// Reintenta la emisión de un e-CF que quedó en estado 'error' o 'Rechazado'.
// Consume una nueva secuencia (las secuencias no se reutilizan ante la DGII).
export async function POST(req: NextRequest) {
  try {
    const { companyId, saleId } = await req.json();
    if (!companyId || !saleId) {
      return NextResponse.json({ error: 'companyId y saleId requeridos' }, { status: 400 });
    }

    const saleRef  = adminDb.collection('sales').doc(saleId);
    const saleSnap = await saleRef.get();
    if (!saleSnap.exists) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });

    const sale = saleSnap.data()!;
    if (sale.companyId !== companyId) {
      return NextResponse.json({ error: 'La venta no pertenece a esta empresa' }, { status: 403 });
    }

    const items: VentaItemInput[] = (sale.items ?? []).map((item: any) => ({
      productName: item.productName,
      productCode: item.productCode,
      quantity:    item.quantity,
      price:       item.price,
      discount:    item.discount ?? 0,
      taxable:     (item.tax ?? 0) > 0,
    }));

    const { factura, cliente, esWalkIn } = mapVentaToFactura({ id: saleId, items, customer: sale.customer ?? null });

    const dgii = await emitirECF(companyId, factura, cliente, esWalkIn, false);
    await saleRef.update({ dgii });

    return NextResponse.json({ ok: true, dgii });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
