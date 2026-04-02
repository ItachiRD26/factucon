import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/portal/products?companyId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const snap = await adminDb
    .collection('products')
    .where('companyId', '==', companyId)
    .orderBy('createdAt', 'desc')
    .get();

  const products = snap.docs.map(d => {
    const data = d.data();
    return {
      id:       d.id,
      code:     data.code,
      name:     data.name,
      price:    data.price,
      cost:     data.cost ?? 0,
      stock:    data.stock,
      category: data.category ?? '',
      taxable:  data.taxable ?? true,
      barcode:  data.barcode ?? '',
      isActive: data.isActive ?? true,
    };
  });

  return NextResponse.json({ products });
}

// POST /api/portal/products — crear producto
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, code, name, price, cost, stock, category, taxable, barcode } = body;

  if (!companyId || !code || !name) {
    return NextResponse.json({ error: 'companyId, code y name son requeridos' }, { status: 400 });
  }

  // Verificar que el código no esté repetido en la empresa
  const existing = await adminDb
    .collection('products')
    .where('companyId', '==', companyId)
    .where('code', '==', code)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: `Ya existe un producto con el código "${code}"` }, { status: 409 });
  }

  const now = Timestamp.now();
  const ref = adminDb.collection('products').doc();

  await ref.set({
    id:        ref.id,
    companyId,
    code:      code.trim().toUpperCase(),
    name:      name.trim(),
    price:     parseFloat(price) || 0,
    cost:      parseFloat(cost)  || 0,
    stock:     parseInt(stock)   || 0,
    category:  category?.trim() ?? 'General',
    taxable:   taxable ?? true,
    barcode:   barcode?.trim() ?? '',
    isActive:  true,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, id: ref.id });
}

// PUT /api/portal/products — actualizar producto
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, companyId, ...updates } = body;

  if (!id || !companyId) {
    return NextResponse.json({ error: 'id y companyId requeridos' }, { status: 400 });
  }

  const cleanUpdates: Record<string, any> = { updatedAt: Timestamp.now() };

  if (updates.code     !== undefined) cleanUpdates.code     = updates.code.trim().toUpperCase();
  if (updates.name     !== undefined) cleanUpdates.name     = updates.name.trim();
  if (updates.price    !== undefined) cleanUpdates.price    = parseFloat(updates.price) || 0;
  if (updates.cost     !== undefined) cleanUpdates.cost     = parseFloat(updates.cost)  || 0;
  if (updates.stock    !== undefined) cleanUpdates.stock    = parseInt(updates.stock)   || 0;
  if (updates.category !== undefined) cleanUpdates.category = updates.category.trim();
  if (updates.taxable  !== undefined) cleanUpdates.taxable  = updates.taxable;
  if (updates.barcode  !== undefined) cleanUpdates.barcode  = updates.barcode.trim();
  if (updates.isActive !== undefined) cleanUpdates.isActive = updates.isActive;

  await adminDb.collection('products').doc(id).update(cleanUpdates);
  return NextResponse.json({ ok: true });
}

// DELETE /api/portal/products?id=xxx
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  // Soft delete
  await adminDb.collection('products').doc(id).update({ isActive: false, updatedAt: Timestamp.now() });
  return NextResponse.json({ ok: true });
}