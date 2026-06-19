import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { authenticateApiKey } from '@/lib/api/auth';

// GET /api/v1/clients — lista los clientes activos de la empresa de la API key.
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: 'API key inválida o revocada' }, { status: 401 });

  const snap = await adminDb.collection('clients')
    .where('companyId', '==', auth.companyId)
    .where('isActive', '==', true)
    .orderBy('name', 'asc')
    .get();

  const clients = snap.docs.map(d => {
    const data = d.data();
    return {
      id:            d.id,
      name:          data.name,
      rnc:           data.rnc ?? '',
      phone:         data.phone ?? '',
      email:         data.email ?? '',
      address:       data.address ?? '',
      creditLimit:   data.creditLimit ?? 0,
      balance:       data.balance ?? 0,
      subtipoFiscal: data.subtipoFiscal ?? 'regular',
    };
  });
  return NextResponse.json({ clients });
}

// POST /api/v1/clients — crea un cliente para la empresa de la API key.
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: 'API key inválida o revocada' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, rnc, phone, email, address, creditLimit, subtipoFiscal } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name requerido' }, { status: 400 });

    const now = Timestamp.now();
    const ref = adminDb.collection('clients').doc();
    await ref.set({
      id:            ref.id,
      companyId:     auth.companyId,
      name:          name.trim(),
      rnc:           rnc ?? '',
      phone:         phone ?? '',
      email:         email ?? '',
      address:       address ?? '',
      creditLimit:   creditLimit ?? 0,
      balance:       0,
      isActive:      true,
      subtipoFiscal: subtipoFiscal ?? 'regular',
      createdAt:     now,
      updatedAt:     now,
    });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
