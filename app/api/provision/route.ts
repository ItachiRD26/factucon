import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { generateCodesForCompany } from '@/lib/db/codes';
import { SubscriptionStatus, ModuleId, TemplateId, ActivationCode } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ownerId, name, slug, rnc, phone, email,
      primaryColor, templateId, modules, users,
    } = body;

    if (!ownerId || !name || !slug) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verificar que el slug no esté tomado
    const existing = await adminDb
      .collection('companies')
      .where('slug', '==', slug)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: 'Ese nombre de subdominio ya está en uso. Elige otro nombre.' }, { status: 409 });
    }

    const now       = Timestamp.now();
    const trialEnd  = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
    const companyId = `${slug}-${Date.now()}`;

    // Calcular precio
    const { calculatePrice, PRICING } = await import('@/lib/types');
    const planPrice = calculatePrice(modules as ModuleId[], users.length);

    // Crear empresa en Firestore (Admin SDK)
    await adminDb.collection('companies').doc(companyId).set({
      id:           companyId,
      ownerId,
      name,
      slug,
      rnc:          rnc || '',
      phone:        phone || '',
      email:        email || '',
      primaryColor: primaryColor || '#0EA5E9',
      templateId:   templateId as TemplateId,
      modules,
      maxUsers:     users.length,
      codes:        [],
      settings: {
        currency: 'DOP',
        timezone: 'America/Santo_Domingo',
        taxRate:  18,
        language: 'es',
      },
      subscription: {
        status:             'trial' as SubscriptionStatus,
        planPrice,
        currentPeriodStart: now,
        currentPeriodEnd:   trialEnd,
        trialEndsAt:        trialEnd,
        reactivationFee:    PRICING.reactivationFee,
      },
      subdomain: { provisioned: false },
      createdAt: now,
      updatedAt: now,
    });

    // Generar códigos de activación
    const codes = await generateCodesForCompany(companyId, users);

    // Guardar códigos en la empresa
    await adminDb.collection('companies').doc(companyId).update({
      codes: codes.map((c: ActivationCode) => ({
        code:      c.code,
        role:      c.role,
        label:     c.label,
        isActive:  true,
        companyId,
        createdAt: now,
      })),
    });

    return NextResponse.json({ companyId, codes });
  } catch (error: any) {
    console.error('Provision error:', error);
    return NextResponse.json({ error: error.message ?? 'Error del servidor' }, { status: 500 });
  }
}