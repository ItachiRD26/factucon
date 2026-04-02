import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.CRON_SECRET ?? 'factucon-secret-key-change-in-production'
);

export async function POST(req: NextRequest) {
  try {
    const { code, slug } = await req.json();

    if (!code || !slug) {
      return NextResponse.json({ error: 'Código y slug requeridos' }, { status: 400 });
    }

    // Buscar la empresa por slug
    const companySnap = await adminDb
      .collection('companies')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (companySnap.empty) {
      return NextResponse.json({ error: 'Sistema no encontrado' }, { status: 404 });
    }

    const companyDoc  = companySnap.docs[0];
    const companyData = companyDoc.data();
    const companyId   = companyDoc.id;

    // Verificar estado de suscripción
    const status = companyData.subscription?.status;
    if (status === 'blocked' || status === 'inactive' || status === 'canceled') {
      return NextResponse.json(
        { error: 'Este sistema está bloqueado. Contacta al administrador.' },
        { status: 403 }
      );
    }

    // Buscar el código de activación
    const codeSnap = await adminDb
      .collection('activation_codes')
      .where('code', '==', code)
      .where('companyId', '==', companyId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (codeSnap.empty) {
      return NextResponse.json(
        { error: 'Código inválido o ya no está activo' },
        { status: 401 }
      );
    }

    const codeData = codeSnap.docs[0].data();

    // Registrar último uso
    await adminDb
      .collection('activation_codes')
      .doc(codeSnap.docs[0].id)
      .update({ lastUsedAt: new Date() });

    // Generar JWT con la sesión del sistema
    const token = await new SignJWT({
      companyId,
      slug,
      role:      codeData.role,
      label:     codeData.label,
      code:      codeData.code,
      // Módulos activos de la empresa
      modules:   companyData.modules ?? [],
      companyName: companyData.name,
      primaryColor: companyData.primaryColor,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return NextResponse.json({ token, role: codeData.role });
  } catch (error: any) {
    console.error('Activate error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}