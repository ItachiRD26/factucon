import { NextRequest, NextResponse } from 'next/server';
import { SET_PRUEBAS_DGII } from '@/lib/dgii/xml-builder';
import { ejecutarCasoPrueba } from '@/lib/dgii/certificacion';

// POST /api/sistema/dgii/certificacion/ejecutar-caso — { companyId, casoId }
// Ejecuta (o reintenta) un caso del set oficial de pruebas DGII y persiste su resultado.
export async function POST(req: NextRequest) {
  try {
    const { companyId, casoId } = await req.json();
    if (!companyId || !casoId) {
      return NextResponse.json({ error: 'companyId y casoId requeridos' }, { status: 400 });
    }

    const caso = SET_PRUEBAS_DGII.find((c) => c.eNCF === casoId);
    if (!caso) return NextResponse.json({ error: 'Caso de prueba no encontrado' }, { status: 404 });

    const resultado = await ejecutarCasoPrueba(companyId, caso);
    return NextResponse.json({ ok: true, resultado });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
