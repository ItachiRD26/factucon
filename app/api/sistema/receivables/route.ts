import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  // Actualizar estado de vencidas
  const now = new Date();
  const snap = await adminDb.collection('receivables')
    .where('companyId', '==', companyId).orderBy('createdAt', 'desc').get();

  const batch = adminDb.batch();
  const receivables = snap.docs.map(d => {
    const data = d.data();
    let status = data.status;
    const dueDate = data.dueDate?.toDate?.() ?? null;
    if (status === 'pending' && dueDate && dueDate < now) {
      status = 'overdue';
      batch.update(d.ref, { status: 'overdue' });
    }
    return {
      id: d.id, clientName: data.clientName, clientId: data.clientId,
      saleNumber: data.saleNumber, amount: data.amount, paid: data.paid ?? 0,
      balance: data.amount - (data.paid ?? 0), status,
      dueDate: data.dueDate?.toDate?.()?.toISOString() ?? null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
    };
  });
  await batch.commit();

  return NextResponse.json({ receivables });
}

export async function POST(req: NextRequest) {
  // Crear cuenta por cobrar desde una venta a crédito
  const body = await req.json();
  const { companyId, clientId, clientName, saleId, saleNumber, amount, dueDays = 30 } = body;
  if (!companyId || !amount) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const now     = Timestamp.now();
  const dueDate = Timestamp.fromDate(new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000));
  const ref     = adminDb.collection('receivables').doc();

  await ref.set({
    id: ref.id, companyId, clientId: clientId ?? '', clientName: clientName ?? '',
    saleId: saleId ?? '', saleNumber: saleNumber ?? '',
    amount, paid: 0, status: 'pending', dueDate, createdAt: now, updatedAt: now,
  });

  // Actualizar balance del cliente
  if (clientId) {
    const clientSnap = await adminDb.collection('clients').where('companyId', '==', companyId).limit(1).get();
    if (!clientSnap.empty) {
      await adminDb.collection('clients').doc(clientId).update({
        balance: FieldValue.increment(amount), updatedAt: now,
      });
    }
  }
  return NextResponse.json({ ok: true, id: ref.id });
}

export async function PUT(req: NextRequest) {
  // Registrar un pago parcial o total
  const body = await req.json();
  const { id, amount, companyId } = body;
  if (!id || !amount) return NextResponse.json({ error: 'id y amount requeridos' }, { status: 400 });

  const docSnap = await adminDb.collection('receivables').doc(id).get();
  if (!docSnap.exists) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const data       = docSnap.data()!;
  const newPaid    = (data.paid ?? 0) + amount;
  const newBalance = data.amount - newPaid;
  const newStatus  = newBalance <= 0 ? 'paid' : 'partial';
  const now        = Timestamp.now();

  await adminDb.collection('receivables').doc(id).update({
    paid: newPaid, status: newStatus, updatedAt: now,
  });

  // Actualizar balance del cliente
  if (data.clientId) {
    await adminDb.collection('clients').doc(data.clientId).update({
      balance: FieldValue.increment(-amount), updatedAt: now,
    });
  }

  // Registrar movimiento de pago
  const payRef = adminDb.collection('payments').doc();
  await payRef.set({
    id: payRef.id, companyId, receivableId: id,
    clientId: data.clientId, clientName: data.clientName,
    amount, saleNumber: data.saleNumber,
    createdAt: now,
  });

  return NextResponse.json({ ok: true, newBalance: Math.max(0, newBalance), status: newStatus });
}