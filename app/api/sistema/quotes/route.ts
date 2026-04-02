import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const snap = await adminDb.collection('quotes')
    .where('companyId', '==', companyId)
    .orderBy('createdAt', 'desc').limit(50).get();

  const quotes = snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null };
  });
  return NextResponse.json({ quotes });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, clientName, clientRnc, items, subtotal, tax, total, notes, validUntil, createdBy } = body;
  if (!companyId || !items?.length) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const counterRef  = adminDb.collection('counters').doc(companyId);
  const counterSnap = await counterRef.get();
  const num         = (counterSnap.data()?.quotes ?? 0) + 1;
  await counterRef.set({ quotes: num }, { merge: true });
  const quoteNumber = `Q-${String(num).padStart(5, '0')}`;

  const now = Timestamp.now();
  const ref = adminDb.collection('quotes').doc();
  await ref.set({ id: ref.id, companyId, number: quoteNumber, clientName: clientName ?? 'Sin nombre', clientRnc: clientRnc ?? '', items, subtotal, tax, total, notes: notes ?? '', validUntil: validUntil ?? '', status: 'draft', createdBy: createdBy ?? '', createdAt: now, updatedAt: now });

  return NextResponse.json({ ok: true, id: ref.id, number: quoteNumber });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, status, companyId } = body;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  await adminDb.collection('quotes').doc(id).update({ status, updatedAt: Timestamp.now() });
  return NextResponse.json({ ok: true });
}