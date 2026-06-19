import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { cargarCertificado } from '@/lib/dgii/cert-crypto';
import { getToken } from '@/lib/dgii/dgii-client';
import type { DgiiAmbiente } from '@/lib/dgii/types';

// POST /api/portal/dgii/test — { companyId } → prueba la conexión con DGII obteniendo un token
export async function POST(req: NextRequest) {
  try {
    const { companyId } = await req.json();
    if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

    const snap = await adminDb.collection('companies').doc(companyId).get();
    if (!snap.exists) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

    const ambiente: DgiiAmbiente = snap.data()?.dgiiConfig?.ambiente ?? 'testecf';

    const cert  = await cargarCertificado(companyId);
    const token = await getToken(companyId, ambiente, cert);

    if (!token) {
      return NextResponse.json({
        ok: false,
        error: 'La DGII no devolvió un token. Verifica el certificado, la contraseña y el ambiente seleccionado.',
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Error desconocido' });
  }
}
