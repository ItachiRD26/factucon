'use client';
import Link from 'next/link';
import { Company } from '@/lib/types';

interface Props { company: Company }

export function SubscriptionAlert({ company }: Props) {
  const sub    = company.subscription;
  const status = sub.status;

  if (status === 'active') return null;

  const daysLeft = sub.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : null;

  const alerts: Record<string, { bg: string; border: string; color: string; icon: string; msg: string; cta?: string }> = {
    trial: {
      bg: 'rgba(14,165,233,.06)', border: 'rgba(14,165,233,.2)', color: '#38BDF8',
      icon: '⭐',
      msg: daysLeft !== null && daysLeft > 0
        ? `Período de prueba — ${daysLeft} días restantes`
        : 'Tu período de prueba ha vencido',
      cta: 'Ver planes',
    },
    past_due: {
      bg: 'rgba(245,158,11,.06)', border: 'rgba(245,158,11,.2)', color: '#FCD34D',
      icon: '⚠️',
      msg: 'Pago pendiente. El sistema se bloqueará en 2 días.',
      cta: 'Pagar ahora',
    },
    blocked: {
      bg: 'rgba(239,68,68,.06)', border: 'rgba(239,68,68,.2)', color: '#F87171',
      icon: '🔒',
      msg: 'Sistema bloqueado por falta de pago. Reactiva para continuar.',
      cta: 'Reactivar',
    },
    inactive: {
      bg: 'rgba(139,92,246,.06)', border: 'rgba(139,92,246,.2)', color: '#A78BFA',
      icon: '💀',
      msg: `Inactivo +30 días. Se requiere tarifa de reactivación de RD$${sub.reactivationFee}.`,
      cta: 'Reactivar',
    },
    canceled: {
      bg: 'rgba(148,163,184,.06)', border: 'rgba(148,163,184,.2)', color: '#94A3B8',
      icon: '🚫',
      msg: 'Suscripción cancelada.',
      cta: 'Activar plan',
    },
  };

  const alert = alerts[status];
  if (!alert) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderRadius: 12,
      background: alert.bg, border: `1px solid ${alert.border}`,
      marginBottom: 20, flexWrap: 'wrap', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{alert.icon}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: alert.color }}>
          {alert.msg}
        </span>
      </div>
      {alert.cta && (
        <Link
          href={`/portal/dashboard/empresa/${company.id}/facturacion`}
          style={{
            fontSize: '0.75rem', fontWeight: 700, color: alert.color,
            padding: '5px 14px', borderRadius: 8,
            border: `1px solid ${alert.border}`,
            background: alert.bg, textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {alert.cta} →
        </Link>
      )}
    </div>
  );
}