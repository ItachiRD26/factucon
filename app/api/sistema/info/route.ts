import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug requerido' }, { status: 400 });
  }

  try {
    const snap = await adminDb
      .collection('companies')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: 'Sistema no encontrado' },
        { status: 404 }
      );
    }

    const data = snap.docs[0].data();

    // Solo devolver info pública — nunca datos sensibles
    return NextResponse.json({
      name:         data.name,
      primaryColor: data.primaryColor ?? '#0EA5E9',
      templateId:   data.templateId,
      logoUrl:      data.logoUrl ?? null,
      status:       data.subscription?.status ?? 'active',
    });
  } catch (error: any) {
    console.error('Sistema info error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}