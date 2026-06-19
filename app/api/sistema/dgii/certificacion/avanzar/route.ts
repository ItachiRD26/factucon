import { NextRequest, NextResponse } from 'next/server';
import { avanzarAmbiente } from '@/lib/dgii/certificacion';

// POST /api/sistema/dgii/certificacion/avanzar — { companyId, ambiente: 'certecf' | 'ecf' }
// Confirma el avance manual de ambiente tras la aprobación de la DGII en su Oficina Virtual.
export async function POST(req: NextRequest) {
  try {
    const { companyId, ambiente } = await req.json();
    if (!companyId || (ambiente !== 'certecf' && ambiente !== 'ecf')) {
      return NextResponse.json({ error: 'companyId y ambiente (certecf|ecf) requeridos' }, { status: 400 });
    }

    await avanzarAmbiente(companyId, ambiente);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
