import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { avanzarAmbiente } from '@/lib/dgii/certificacion';
import { hasPaidPlan } from '@/lib/subscriptions/gates';
import type { Company } from '@/lib/types';

// POST /api/sistema/dgii/certificacion/avanzar — { companyId, ambiente: 'certecf' | 'ecf' }
// Confirma el avance manual de ambiente tras la aprobación de la DGII en su Oficina Virtual.
export async function POST(req: NextRequest) {
  try {
    const { companyId, ambiente } = await req.json();
    if (!companyId || (ambiente !== 'certecf' && ambiente !== 'ecf')) {
      return NextResponse.json({ error: 'companyId y ambiente (certecf|ecf) requeridos' }, { status: 400 });
    }

    const companySnap = await adminDb.collection('companies').doc(companyId).get();
    if (!companySnap.exists) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    if (!hasPaidPlan((companySnap.data() as Company).subscription.status)) {
      return NextResponse.json({ error: 'Necesitas tener tu plan activo (pagado) para certificarte ante la DGII.' }, { status: 402 });
    }

    await avanzarAmbiente(companyId, ambiente);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
