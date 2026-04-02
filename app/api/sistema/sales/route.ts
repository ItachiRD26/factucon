import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

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

    // Generar número de venta
    const counterRef  = adminDb.collection('counters').doc(companyId);
    const counterSnap = await counterRef.get();
    const currentNum  = (counterSnap.data()?.sales ?? 0) + 1;
    await counterRef.set({ sales: currentNum }, { merge: true });
    const saleNumber = `V-${String(currentNum).padStart(6, '0')}`;

    const now = Timestamp.now();

    // Crear la venta
    const saleRef = adminDb.collection('sales').doc();
    await saleRef.set({
      id:            saleRef.id,
      companyId,
      saleNumber,
      ncfType:       ncfType ?? 'B02',
      customer:      customer ?? null,
      items:         items.map((item: any) => ({
        productId:   item.productId,
        productName: item.productName,
        productCode: item.productCode,
        quantity:    item.qty,
        price:       item.price,
        discount:    item.discount ?? 0,
        tax:         item.taxable ? item.price * item.qty * 0.18 : 0,
        subtotal:    item.price * item.qty * (1 - (item.discount ?? 0) / 100),
        total:       item.price * item.qty * (1 - (item.discount ?? 0) / 100) + (item.taxable ? item.price * item.qty * 0.18 : 0),
      })),
      subtotal,
      tax,
      total,
      paymentMethod,
      amountPaid,
      change:        change ?? 0,
      cashierId,
      cashierName,
      createdAt:     now,
    });

    // Actualizar stock de cada producto
    const batch = adminDb.batch();
    for (const item of items) {
      const productSnap = await adminDb
        .collection('products')
        .where('companyId', '==', companyId)
        .where('code', '==', item.productCode)
        .limit(1)
        .get();

      if (!productSnap.empty) {
        batch.update(productSnap.docs[0].ref, {
          stock: FieldValue.increment(-item.qty),
          updatedAt: now,
        });
        // Registrar movimiento de inventario
        const movRef = adminDb.collection('inventory_movements').doc();
        batch.set(movRef, {
          id:            movRef.id,
          companyId,
          productId:     productSnap.docs[0].id,
          productName:   item.productName,
          type:          'sale',
          quantity:      -item.qty,
          referenceType: 'sale',
          referenceId:   saleRef.id,
          createdAt:     now,
          createdBy:     cashierId,
        });
      }
    }
    await batch.commit();

    return NextResponse.json({ ok: true, saleId: saleRef.id, saleNumber });
  } catch (error: any) {
    console.error('Sale error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}