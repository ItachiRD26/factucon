import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId   = searchParams.get('companyId');
  const warehouseId = searchParams.get('warehouseId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  // Si piden productos de un almacén específico
  if (warehouseId) {
    const snap = await adminDb.collection('warehouse_stock')
      .where('companyId', '==', companyId)
      .where('warehouseId', '==', warehouseId).get();
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ products });
  }

  const snap = await adminDb.collection('warehouses')
    .where('companyId', '==', companyId).where('isActive', '==', true).orderBy('createdAt').get();

  const warehouses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ warehouses });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, name, address } = body;
  if (!companyId || !name) return NextResponse.json({ error: 'companyId y name requeridos' }, { status: 400 });

  // Verificar si es el primero (será el principal)
  const existing = await adminDb.collection('warehouses')
    .where('companyId', '==', companyId).limit(1).get();
  const isDefault = existing.empty;

  const now = Timestamp.now();
  const ref = adminDb.collection('warehouses').doc();
  await ref.set({
    id: ref.id, companyId, name: name.trim(), address: address ?? '',
    isDefault, isActive: true, createdAt: now, updatedAt: now,
  });
  return NextResponse.json({ ok: true, id: ref.id });
}