import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { DgiiConfig } from '@/lib/types';

const DEFAULT_DGII_CONFIG: DgiiConfig = {
  enabled:            false,
  ambiente:           'testecf',
  rnc:                '',
  actividadEconomica: '',
  certificadoCargado: false,
  vencimientos:       {},
};

// GET /api/portal/dgii?companyId=xxx — configuración DGII actual (sin credenciales)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const snap = await adminDb.collection('companies').doc(companyId).get();
  if (!snap.exists) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

  const stored = (snap.data()?.dgiiConfig as Partial<DgiiConfig> | undefined) ?? {};
  const dgiiConfig: DgiiConfig = { ...DEFAULT_DGII_CONFIG, ...stored };

  return NextResponse.json({ dgiiConfig });
}

// PUT /api/portal/dgii — actualizar configuración DGII (no toca credenciales)
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { companyId, enabled, ambiente, rnc, actividadEconomica, vencimientos } = body;
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const ref  = adminDb.collection('companies').doc(companyId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

  const current = { ...DEFAULT_DGII_CONFIG, ...(snap.data()?.dgiiConfig as Partial<DgiiConfig> | undefined) };

  const updated: DgiiConfig = {
    ...current,
    enabled:            enabled ?? current.enabled,
    ambiente:           ambiente ?? current.ambiente,
    rnc:                rnc !== undefined ? String(rnc).trim() : current.rnc,
    actividadEconomica: actividadEconomica !== undefined ? String(actividadEconomica).trim() : current.actividadEconomica,
    vencimientos:       vencimientos !== undefined ? { ...current.vencimientos, ...vencimientos } : current.vencimientos,
  };

  await ref.update({ dgiiConfig: updated, updatedAt: Timestamp.now() });
  return NextResponse.json({ ok: true, dgiiConfig: updated });
}
