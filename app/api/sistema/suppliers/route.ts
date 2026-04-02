import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const snap = await adminDb.collection('suppliers')
    .where('companyId', '==', companyId).where('isActive', '==', true).orderBy('name').get();

  const suppliers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ suppliers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, name, rnc, phone, email } = body;
  if (!companyId || !name) return NextResponse.json({ error: 'companyId y name requeridos' }, { status: 400 });

  const now = Timestamp.now();
  const ref = adminDb.collection('suppliers').doc();
  await ref.set({ id: ref.id, companyId, name: name.trim(), rnc: rnc ?? '', phone: phone ?? '', email: email ?? '', isActive: true, createdAt: now, updatedAt: now });
  return NextResponse.json({ ok: true, id: ref.id });
}