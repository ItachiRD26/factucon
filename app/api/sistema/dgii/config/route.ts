import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { DgiiAmbiente } from '@/lib/dgii/types';

// GET /api/sistema/dgii/config?companyId=xxx
// Endpoint liviano y seguro de leer desde el sistema (POS/Facturas) — sin credenciales.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const snap = await adminDb.collection('companies').doc(companyId).get();
  if (!snap.exists) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

  const dgiiConfig = snap.data()?.dgiiConfig;
  const enabled  = !!dgiiConfig?.enabled;
  const ambiente: DgiiAmbiente = dgiiConfig?.ambiente ?? 'testecf';

  return NextResponse.json({ enabled, ambiente });
}
