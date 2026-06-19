import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { cargarCertificado } from '@/lib/dgii/cert-crypto';
import { getToken, consultarEstado } from '@/lib/dgii/dgii-client';
import { mapEstadoRFCE } from '@/lib/dgii/emisor';
import type { Company } from '@/lib/types';

// Se llama desde un cron job externo (Vercel Cron o similar) periódicamente.
// Recorre ventas con dgii.estado === 'Enviado' (pendientes de confirmación) y
// consulta su estado final ante la DGII por TrackId.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pendientes = await adminDb.collection('sales')
      .where('dgii.estado', '==', 'Enviado')
      .limit(50)
      .get();

    const porEmpresa = new Map<string, QueryDocumentSnapshot[]>();
    for (const doc of pendientes.docs) {
      const companyId = doc.data().companyId as string;
      porEmpresa.set(companyId, [...(porEmpresa.get(companyId) ?? []), doc]);
    }

    let actualizados = 0;
    for (const [companyId, docs] of porEmpresa) {
      try {
        const companySnap = await adminDb.collection('companies').doc(companyId).get();
        const dgiiConfig  = (companySnap.data() as Company | undefined)?.dgiiConfig;
        if (!dgiiConfig?.enabled) continue;

        const cert  = await cargarCertificado(companyId);
        const token = await getToken(companyId, dgiiConfig.ambiente, cert);
        if (!token) continue;

        for (const doc of docs) {
          const dgii = doc.data().dgii;
          if (!dgii?.trackId) continue;

          const resultado = await consultarEstado(dgii.trackId, token);
          const estado = mapEstadoRFCE(resultado.estado);
          if (estado !== dgii.estado) {
            await doc.ref.update({ 'dgii.estado': estado });
            actualizados++;
          }
        }
      } catch (e) {
        console.warn(`[cron sync-dgii-status] Empresa ${companyId}:`, e instanceof Error ? e.message : e);
      }
    }

    return NextResponse.json({ ok: true, revisados: pendientes.size, actualizados });
  } catch (error: any) {
    console.error('Cron sync-dgii-status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
