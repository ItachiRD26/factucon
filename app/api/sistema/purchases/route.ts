// app/api/sistema/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const snap = await adminDb.collection('purchases')
    .where('companyId', '==', companyId).orderBy('createdAt', 'desc').limit(100).get();

  const purchases = snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null };
  });
  return NextResponse.json({ purchases });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, supplierId, supplierName, items, subtotal, tax, total, notes, createdBy } = body;
  if (!companyId || !items?.length) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const counterRef  = adminDb.collection('counters').doc(companyId);
  const counterSnap = await counterRef.get();
  const num         = (counterSnap.data()?.purchases ?? 0) + 1;
  await counterRef.set({ purchases: num }, { merge: true });
  const number = `OC-${String(num).padStart(5, '0')}`;

  const now = Timestamp.now();
  const ref = adminDb.collection('purchases').doc();
  await ref.set({
    id: ref.id, companyId, number, supplierId: supplierId ?? '', supplierName: supplierName ?? '',
    items, subtotal, tax, total, notes: notes ?? '', status: 'pending',
    createdBy: createdBy ?? '', createdAt: now, updatedAt: now,
  });
  return NextResponse.json({ ok: true, id: ref.id, number });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, status, companyId } = body;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const now = Timestamp.now();
  await adminDb.collection('purchases').doc(id).update({ status, updatedAt: now });

  // Si se marca como recibida → actualizar stock
  if (status === 'received') {
    const snap = await adminDb.collection('purchases').doc(id).get();
    const data = snap.data();
    if (data?.items) {
      const batch = adminDb.batch();
      for (const item of data.items) {
        const prodSnap = await adminDb.collection('products')
          .where('companyId', '==', companyId).where('code', '==', item.productCode).limit(1).get();
        if (!prodSnap.empty) {
          batch.update(prodSnap.docs[0].ref, { stock: FieldValue.increment(item.qty), updatedAt: now });
          const movRef = adminDb.collection('inventory_movements').doc();
          batch.set(movRef, {
            id: movRef.id, companyId, productId: prodSnap.docs[0].id,
            productName: item.productName, type: 'purchase',
            quantity: item.qty, referenceType: 'purchase', referenceId: id,
            createdAt: now, createdBy: data.createdBy ?? '',
          });
        }
      }
      await batch.commit();
    }
  }
  return NextResponse.json({ ok: true });
}