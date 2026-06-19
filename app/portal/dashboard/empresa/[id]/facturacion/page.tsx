'use client';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCompany } from '@/lib/db/companies';
import { Company, PLAN_TIERS } from '@/lib/types';
import { dopToUsd } from '@/lib/paypal/config';

const PLAN_LABEL: Record<string, string> = Object.fromEntries(PLAN_TIERS.map(t => [t.id, t.name]));

const STATUS_COLOR: Record<string, string> = {
  trial:    '#0EA5E9',
  active:   '#10B981',
  past_due: '#F59E0B',
  blocked:  '#EF4444',
  inactive: '#8B5CF6',
  canceled: '#94A3B8',
};
const STATUS_LABEL: Record<string, string> = {
  trial:    'Trial',
  active:   'Activo',
  past_due: 'Pago tardío',
  blocked:  'Bloqueado',
  inactive: 'Inactivo',
  canceled: 'Cancelado',
};
const PAYPAL_STATUS_COLOR: Record<string, string> = {
  APPROVAL_PENDING: '#F59E0B',
  APPROVED:         '#0EA5E9',
  ACTIVE:           '#10B981',
  SUSPENDED:        '#F59E0B',
  CANCELLED:        '#94A3B8',
  EXPIRED:          '#EF4444',
};
const PAYPAL_STATUS_LABEL: Record<string, string> = {
  APPROVAL_PENDING: 'Pendiente de aprobación',
  APPROVED:         'Aprobada',
  ACTIVE:           'Activa',
  SUSPENDED:        'Suspendida',
  CANCELLED:        'Cancelada',
  EXPIRED:          'Expirada',
};

const DATE_FMT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

export default function FacturacionPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FacturacionContent />
    </Suspense>
  );
}

function Loading() {
  return <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,.4)' }}>Cargando...</div>;
}

function FacturacionContent() {
  const { id }       = useParams<{ id: string }>();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [company,    setCompany]    = useState<Company | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error,      setError]      = useState('');
  const [banner,     setBanner]     = useState<'success' | 'canceled' | null>(null);

  useEffect(() => {
    if (!id) return;
    getCompany(id).then(setCompany).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const paypal         = searchParams.get('paypal');
    const subscriptionId = searchParams.get('subscription_id');

    if (paypal === 'success' && subscriptionId) {
      fetch('/api/paypal/confirm-subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ companyId: id, subscriptionId }),
      })
        .then(() => getCompany(id))
        .then(c => { if (c) setCompany(c); setBanner('success'); })
        .finally(() => router.replace(`/portal/dashboard/empresa/${id}/facturacion`));
    } else if (paypal === 'canceled') {
      setBanner('canceled');
      router.replace(`/portal/dashboard/empresa/${id}/facturacion`);
    }
  }, [id, searchParams, router]);

  async function handleConnect() {
    if (!id || connecting) return;
    setConnecting(true);
    setError('');
    try {
      const res = await fetch('/api/paypal/create-subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ companyId: id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Error al conectar con PayPal');
      if (!d.approveUrl) throw new Error('PayPal no devolvió un enlace de aprobación');
      window.location.href = d.approveUrl;
    } catch (e: any) {
      setError(e.message ?? 'Ocurrió un error. Intenta de nuevo.');
      setConnecting(false);
    }
  }

  if (loading) return <Loading />;

  if (!company) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
      <p style={{ color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>Empresa no encontrada</p>
      <Link href="/portal/dashboard" style={{ color: '#0EA5E9', fontSize: '0.82rem' }}>← Volver al dashboard</Link>
    </div>
  );

  const sub         = company.subscription;
  const statusColor = STATUS_COLOR[sub.status] ?? '#94A3B8';
  const statusLabel = STATUS_LABEL[sub.status] ?? sub.status;
  const priceUSD    = dopToUsd(sub.planPrice);
  const daysLeft    = sub.trialEndsAt
    ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null;
  const paypalColor = sub.paypalStatus ? (PAYPAL_STATUS_COLOR[sub.paypalStatus] ?? '#94A3B8') : '#94A3B8';
  const paypalLabel = sub.paypalStatus ? (PAYPAL_STATUS_LABEL[sub.paypalStatus] ?? sub.paypalStatus) : null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link href={`/portal/dashboard/empresa/${id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.4)', fontSize: '0.78rem', textDecoration: 'none', marginBottom: 20 }}>
        ← {company.name}
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 3 }}>
          Facturación
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>
          Gestiona tu plan, el período de prueba y tu método de pago
        </p>
      </div>

      {/* Resultado del checkout de PayPal */}
      {banner === 'success' && (
        <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 12, marginBottom: 20, fontSize: '0.8rem', color: '#34D399', lineHeight: 1.7 }}>
          ✅ Suscripción vinculada — tu período de prueba de 14 días ha comenzado. El cobro automático
          (≈US${priceUSD}/mes) inicia cuando termine.
        </div>
      )}
      {banner === 'canceled' && (
        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 12, marginBottom: 20, fontSize: '0.8rem', color: '#FCD34D', lineHeight: 1.7 }}>
          ⚠️ No completaste la vinculación con PayPal. Puedes intentarlo de nuevo cuando quieras.
        </div>
      )}

      {/* Estado de la suscripción */}
      {sub.status === 'trial' && daysLeft !== null && (
        <div style={{ padding: '12px 16px', background: 'rgba(14,165,233,.08)', border: '1px solid rgba(14,165,233,.2)', borderRadius: 12, marginBottom: 20, fontSize: '0.78rem', color: '#38BDF8' }}>
          ⭐ {daysLeft > 0 ? `${daysLeft} días de prueba restantes` : 'Período de prueba vencido'}
        </div>
      )}
      {(sub.status === 'blocked' || sub.status === 'inactive') && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 12, marginBottom: 20, fontSize: '0.78rem', color: '#F87171' }}>
          🔒 Sistema bloqueado por falta de pago. Conecta tu método de pago para reactivarlo.
        </div>
      )}

      {/* Plan */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>
              Plan mensual
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC' }}>RD${sub.planPrice.toLocaleString()}</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>≈ US${priceUSD}/mes vía PayPal</div>
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: `${statusColor}20`, color: statusColor }}>
            ● {statusLabel}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', marginBottom: 3 }}>Período actual termina</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F8FAFC' }}>
              {sub.currentPeriodEnd.toLocaleDateString('es-DO', DATE_FMT)}
            </div>
          </div>
          {sub.trialEndsAt && (
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', marginBottom: 3 }}>Fin del período de prueba</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F8FAFC' }}>
                {sub.trialEndsAt.toLocaleDateString('es-DO', DATE_FMT)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comprobantes */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>
          Comprobantes este ciclo · Plan {PLAN_LABEL[sub.planId] ?? sub.planId}
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 12 }}>
          {sub.comprobantesUsed.toLocaleString()}
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,.4)' }}> / {sub.comprobanteLimit.toLocaleString()}</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (sub.comprobantesUsed / Math.max(1, sub.comprobanteLimit)) * 100)}%`,
            borderRadius: 99,
            background: sub.comprobantesUsed > sub.comprobanteLimit ? '#F59E0B' : '#0EA5E9',
          }}/>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.7 }}>
          Tu plan incluye {sub.comprobanteLimit.toLocaleString()} comprobantes (facturas) al mes.
          Cada comprobante adicional cuesta <strong style={{ color: '#F8FAFC' }}>RD${sub.overageRate}</strong>{' '}
          y se suma automáticamente a tu siguiente cobro de PayPal — tu sistema sigue funcionando
          sin interrupciones.
        </p>
        {sub.pendingOverageDOP > 0 && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, fontSize: '0.74rem', color: '#FCD34D', lineHeight: 1.7 }}>
            ⚠️ Se aplicó un cargo de RD${sub.pendingOverageDOP.toLocaleString()} (≈US${dopToUsd(sub.pendingOverageDOP)})
            por excedente de comprobantes del ciclo anterior a tu próximo cobro.
          </div>
        )}
      </div>

      {/* PayPal */}
      <div style={{ background: 'rgba(14,165,233,.05)', border: '1px solid rgba(14,165,233,.2)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: '0.68rem', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 14 }}>
          Método de pago — PayPal
        </div>

        {sub.paypalSubscriptionId ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F8FAFC', marginBottom: 3 }}>Suscripción vinculada</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,.4)' }}>
                  {sub.paypalSubscriptionId}
                </div>
              </div>
              {paypalLabel && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: `${paypalColor}20`, color: paypalColor }}>
                  {paypalLabel}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.7, marginBottom: 16 }}>
              Si necesitas cambiar la tarjeta o cuenta de PayPal vinculada, vuelve a conectar — se creará una
              nueva suscripción y la anterior dejará de cobrarse.
            </p>
          </>
        ) : (
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, marginBottom: 16 }}>
            Conecta tu cuenta de PayPal para activar el cobro automático. Tienes{' '}
            <strong style={{ color: '#F8FAFC' }}>14 días gratis</strong> — no se te cobrará nada ahora. El cobro
            (≈US${priceUSD}/mes) inicia cuando termine el período de prueba.
          </p>
        )}

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, fontSize: '0.78rem', color: '#F87171', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button onClick={handleConnect} disabled={connecting}
          style={{ width: '100%', padding: '12px', borderRadius: 11, background: connecting ? 'rgba(14,165,233,.4)' : '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: connecting ? 'not-allowed' : 'pointer', boxShadow: '0 2px 16px rgba(14,165,233,.35)', fontFamily: 'inherit' }}>
          {connecting ? 'Conectando con PayPal...' : sub.paypalSubscriptionId ? '🔄 Reconectar PayPal' : '🔗 Conectar con PayPal'}
        </button>
      </div>

      {/* Política de suscripción */}
      <div style={{ background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 14, padding: '14px 18px', fontSize: '0.73rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.8 }}>
        📌 2 días de gracia si vence el pago. Más de 30 días inactivo requiere tarifa de reactivación de{' '}
        <strong style={{ color: '#FCD34D' }}>RD${sub.reactivationFee.toLocaleString()}</strong>.
      </div>
    </div>
  );
}
