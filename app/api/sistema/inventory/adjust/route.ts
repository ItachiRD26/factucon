import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { companyId, productId, type, quantity, reason, createdBy } = await req.json();
    if (!companyId || !productId || !quantity) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const now     = Timestamp.now();
    const prodRef = adminDb.collection('products').doc(productId);
    const snap    = await prodRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const currentStock = snap.data()!.stock ?? 0;
    let newStock: number;

    if (type === 'add')      newStock = currentStock + quantity;
    else if (type === 'subtract') newStock = Math.max(0, currentStock - quantity);
    else                     newStock = quantity; // 'set'

    const delta = newStock - currentStock;

    await prodRef.update({ stock: newStock, updatedAt: now });

    // Registrar movimiento
    const movRef = adminDb.collection('inventory_movements').doc();
    await movRef.set({
      id:            movRef.id,
      companyId,
      productId,
      productName:   snap.data()!.name,
      type:          'adjustment',
      quantity:      delta,
      previousStock: currentStock,
      newStock,
      reason:        reason ?? '',
      referenceType: 'manual',
      createdAt:     now,
      createdBy,
    });

    return NextResponse.json({ ok: true, newStock });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}