import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const snap = await adminDb.collection('clients')
    .where('companyId', '==', companyId)
    .where('isActive', '==', true)
    .orderBy('name', 'asc').get();

  const clients = snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, name: data.name, rnc: data.rnc ?? '', phone: data.phone ?? '', email: data.email ?? '', address: data.address ?? '', creditLimit: data.creditLimit ?? 0, balance: data.balance ?? 0, isActive: data.isActive ?? true, subtipoFiscal: data.subtipoFiscal ?? 'regular' };
  });
  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, name, rnc, phone, email, address, creditLimit, subtipoFiscal } = body;
  if (!companyId || !name) return NextResponse.json({ error: 'companyId y name requeridos' }, { status: 400 });

  const now = Timestamp.now();
  const ref = adminDb.collection('clients').doc();
  await ref.set({ id: ref.id, companyId, name: name.trim(), rnc: rnc ?? '', phone: phone ?? '', email: email ?? '', address: address ?? '', creditLimit: creditLimit ?? 0, balance: 0, isActive: true, subtipoFiscal: subtipoFiscal ?? 'regular', createdAt: now, updatedAt: now });
  return NextResponse.json({ ok: true, id: ref.id });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, companyId, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const clean: Record<string, any> = { updatedAt: Timestamp.now() };
  if (updates.name        !== undefined) clean.name        = updates.name.trim();
  if (updates.rnc         !== undefined) clean.rnc         = updates.rnc;
  if (updates.phone       !== undefined) clean.phone       = updates.phone;
  if (updates.email       !== undefined) clean.email       = updates.email;
  if (updates.address     !== undefined) clean.address     = updates.address;
  if (updates.creditLimit !== undefined) clean.creditLimit = updates.creditLimit;
  if (updates.isActive    !== undefined) clean.isActive    = updates.isActive;
  if (updates.subtipoFiscal !== undefined) clean.subtipoFiscal = updates.subtipoFiscal;

  await adminDb.collection('clients').doc(id).update(clean);
  return NextResponse.json({ ok: true });
}