import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { SET_PRUEBAS_DGII } from '@/lib/dgii/xml-builder';
import type { ResultadoCaso, ProgresoCertificacion } from '@/lib/dgii/certificacion';
import type { Company } from '@/lib/types';

// GET /api/sistema/dgii/certificacion?companyId=xxx
// Estado de la certificación guiada: config DGII relevante + progreso de los
// casos de SET_PRUEBAS_DGII ejecutados hasta ahora.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const companySnap = await adminDb.collection('companies').doc(companyId).get();
  if (!companySnap.exists) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

  const dgiiConfig = (companySnap.data() as Company).dgiiConfig;

  const certSnap = await adminDb.collection('companies').doc(companyId).collection('dgii_config').doc('certificacion').get();
  const certData = certSnap.data() ?? {};
  const casos: Record<string, ResultadoCaso> = certData.casos ?? {};
  const progreso: ProgresoCertificacion = certData.progreso ?? {
    total:       SET_PRUEBAS_DGII.length,
    completados: Object.keys(casos).length,
    pasados:     Object.values(casos).filter((c) => c.paso).length,
  };

  return NextResponse.json({
    dgiiConfig: {
      enabled:                   !!dgiiConfig?.enabled,
      ambiente:                  dgiiConfig?.ambiente ?? 'testecf',
      certificadoCargado:        !!dgiiConfig?.certificadoCargado,
      rnc:                       dgiiConfig?.rnc ?? '',
      actividadEconomica:        dgiiConfig?.actividadEconomica ?? '',
      certificacionConfirmadaAt: dgiiConfig?.certificacionConfirmadaAt ?? null,
    },
    subscriptionStatus: (companySnap.data() as Company).subscription.status,
    certificacion: { casos, progreso },
    casosDisponibles: SET_PRUEBAS_DGII.map((c) => ({
      eNCF: c.eNCF, tipoECF: c.tipoECF, nombreItem: c.nombreItem, montoTotal: c.montoTotal,
    })),
  });
}
