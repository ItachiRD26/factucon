// Autenticación de la API pública /api/v1/* mediante API keys (lib/api-keys.ts).

import { NextRequest } from 'next/server';
import { verifyApiKey } from '@/lib/api-keys';

export async function authenticateApiKey(req: NextRequest): Promise<{ companyId: string } | null> {
  const auth = req.headers.get('authorization') ?? '';
  const [scheme, rawKey] = auth.split(' ');
  if (scheme !== 'Bearer' || !rawKey) return null;

  const result = await verifyApiKey(rawKey);
  if (!result) return null;

  return { companyId: result.companyId };
}
