import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey, listApiKeys, revokeApiKey } from '@/lib/api-keys';

// GET /api/sistema/api-keys?companyId=xxx — lista las claves activas (sin exponer el hash).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const keys = await listApiKeys(companyId);
  return NextResponse.json({ keys });
}

// POST /api/sistema/api-keys — { companyId, label } → genera una clave nueva.
// La clave cruda (rawKey) se devuelve una sola vez.
export async function POST(req: NextRequest) {
  try {
    const { companyId, label } = await req.json();
    if (!companyId || !label?.trim()) {
      return NextResponse.json({ error: 'companyId y label requeridos' }, { status: 400 });
    }

    const { id, rawKey } = await generateApiKey(companyId, label);
    return NextResponse.json({ ok: true, id, rawKey });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}

// DELETE /api/sistema/api-keys — { companyId, keyId } → revoca una clave.
export async function DELETE(req: NextRequest) {
  try {
    const { companyId, keyId } = await req.json();
    if (!companyId || !keyId) {
      return NextResponse.json({ error: 'companyId y keyId requeridos' }, { status: 400 });
    }

    await revokeApiKey(companyId, keyId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
