import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { generateCodesForCompany } from '@/lib/db/codes';
import { SubscriptionStatus, ModuleId, TemplateId, ActivationCode, calculatePrice, PRICING } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ownerId,
      name,
      slug,
      rnc,
      phone,
      email,
      primaryColor,
      templateId,
      modules,
      users,
    } = body;

    // ── Validación básica ─────────────────────────────────────
    if (!ownerId || !name || !slug) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: ownerId, name, slug' },
        { status: 400 }
      );
    }

    // Slug solo letras, números y guiones
    const slugValid = /^[a-z0-9-]+$/.test(slug);
    if (!slugValid) {
      return NextResponse.json(
        { error: 'El nombre del sistema solo puede tener letras, números y guiones' },
        { status: 400 }
      );
    }

    // ── Verificar que el slug no esté tomado ──────────────────
    const existing = await adminDb
      .collection('companies')
      .where('slug', '==', slug)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Ese nombre de subdominio ya está en uso. Elige otro nombre.' },
        { status: 409 }
      );
    }

    // ── Calcular precio ───────────────────────────────────────
    const planPrice = calculatePrice(modules as ModuleId[], users.length);

    // ── Timestamps ────────────────────────────────────────────
    const now      = Timestamp.now();
    const trialEnd = Timestamp.fromDate(
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    );
    const companyId = `${slug}-${Date.now()}`;

    // ── Crear empresa en Firestore ────────────────────────────
    await adminDb.collection('companies').doc(companyId).set({
      id:           companyId,
      ownerId,
      name,
      slug,
      rnc:          rnc          || '',
      phone:        phone        || '',
      email:        email        || '',
      primaryColor: primaryColor || '#0EA5E9',
      templateId:   templateId  as TemplateId,
      modules:      modules      as ModuleId[],
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

    // ── Generar códigos de activación ─────────────────────────
    const codes = await generateCodesForCompany(companyId, users);

    // Guardar códigos dentro de la empresa también
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

    // ── Provisionar subdominio en Vercel ──────────────────────
    // Solo si las variables de entorno están configuradas
    if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
      try {
        const { addSubdomain } = await import('@/lib/vercel/domains');
        const { id: vercelDomainId } = await addSubdomain(slug);
        await adminDb.collection('companies').doc(companyId).update({
          'subdomain.provisioned':    true,
          'subdomain.provisionedAt':  now,
          'subdomain.vercelDomainId': vercelDomainId,
        });
        console.log(`✅ Subdominio creado: ${slug}.factucon.do`);
      } catch (subdomainError) {
        // No falla el proceso principal si el subdominio falla
        // El admin puede agregarlo manualmente desde el panel de Vercel
        console.error('⚠️ Error creando subdominio (no crítico):', subdomainError);
      }
    } else {
      console.log('ℹ️ VERCEL_TOKEN no configurado — subdominio no creado automáticamente');
    }

    // ── Enviar email de bienvenida ────────────────────────────
    if (process.env.RESEND_API_KEY) {
      try {
        const { sendEmail }              = await import('@/lib/email/client');
        const { WelcomeEmailTemplate }   = await import('@/lib/email/templates/welcome');

        // Obtener email del owner
        const ownerSnap = await adminDb.collection('portal_users').doc(ownerId).get();
        const ownerData = ownerSnap.data();

        if (ownerData?.email) {
          await sendEmail({
            to:      ownerData.email,
            subject: `¡Tu sistema ${name} está listo! 🚀`,
            html:    WelcomeEmailTemplate({
              companyName: name,
              ownerName:   ownerData.displayName ?? 'Usuario',
              slug,
              codes,
            }),
          });
        }
      } catch (emailError) {
        // Email no es crítico
        console.error('⚠️ Error enviando email de bienvenida:', emailError);
      }
    }

    // ── Respuesta exitosa ─────────────────────────────────────
    return NextResponse.json({
      ok:        true,
      companyId,
      codes:     codes.map((c: ActivationCode) => ({
        code:  c.code,
        role:  c.role,
        label: c.label,
      })),
      subdomain: `${slug}.factucon.do`,
    });

  } catch (error: any) {
    console.error('❌ Provision error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Error del servidor' },
      { status: 500 }
    );
  }
}