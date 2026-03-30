import { NextRequest, NextResponse } from 'next/server';
import { checkAndBlockExpiredSubscriptions } from '@/lib/subscriptions/block';

// Se llama desde un cron job externo (Vercel Cron o similar) cada 24 horas
export async function GET(req: NextRequest) {
  // Verificar secret para que no lo llame cualquiera
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkAndBlockExpiredSubscriptions();
    return NextResponse.json({
      ok: true,
      blocked:  result.blocked.length,
      inactive: result.inactive.length,
      details:  result,
    });
  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}