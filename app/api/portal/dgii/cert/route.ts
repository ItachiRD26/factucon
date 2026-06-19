import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { loadCertAndKey } from '@/lib/dgii/xml-signer';
import { guardarCertificado } from '@/lib/dgii/cert-crypto';
import { hasPaidPlan } from '@/lib/subscriptions/gates';
import type { Company } from '@/lib/types';

// POST /api/portal/dgii/cert — multipart/form-data: companyId, password, file (.p12)
export async function POST(req: NextRequest) {
  try {
    const form      = await req.formData();
    const companyId = form.get('companyId');
    const password  = form.get('password');
    const file       = form.get('file');

    if (typeof companyId !== 'string' || !companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }
    if (typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Archivo .p12 requerido' }, { status: 400 });
    }

    const companySnap = await adminDb.collection('companies').doc(companyId).get();
    if (!companySnap.exists) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    const status = (companySnap.data() as Company).subscription.status;
    if (!hasPaidPlan(status)) {
      return NextResponse.json({ error: 'Necesitas tener tu plan activo (pagado) para certificarte ante la DGII.' }, { status: 402 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validar antes de guardar — evita persistir un .p12/contraseña inválidos
    try {
      loadCertAndKey(buffer, password);
    } catch (e) {
      return NextResponse.json({
        error: 'Certificado o contraseña inválidos: ' + (e instanceof Error ? e.message : 'error desconocido'),
      }, { status: 400 });
    }

    await guardarCertificado(companyId, buffer, password);

    await adminDb.collection('companies').doc(companyId).update({
      'dgiiConfig.certificadoCargado': true,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
