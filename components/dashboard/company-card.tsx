'use client';

import Link from 'next/link';
import { Company, SubscriptionStatus } from '@/lib/types';

interface Props { company: Company }

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string; bg: string; dot: string }> = {
  trial:    { label: 'Trial',       color: '#38BDF8', bg: 'rgba(14,165,233,.12)',  dot: '#0EA5E9' },
  active:   { label: 'Activo',      color: '#34D399', bg: 'rgba(16,185,129,.12)',  dot: '#10B981' },
  past_due: { label: 'Pago tardío', color: '#FCD34D', bg: 'rgba(245,158,11,.12)',  dot: '#F59E0B' },
  blocked:  { label: 'Bloqueado',   color: '#F87171', bg: 'rgba(239,68,68,.12)',   dot: '#EF4444' },
  inactive: { label: 'Inactivo',    color: '#A78BFA', bg: 'rgba(139,92,246,.12)',  dot: '#8B5CF6' },
  canceled: { label: 'Cancelado',   color: '#94A3B8', bg: 'rgba(148,163,184,.12)', dot: '#94A3B8' },
};

const TEMPLATE_ICONS: Record<string, string> = {
  pharmacy:'💊', workshop:'🔧', restaurant:'🍽️', grocery:'🏪',
  clinic:'🏥', boutique:'👗', hardware:'🏗️', bookstore:'📚',
  salon:'💈', custom:'⚙️',
};

export function CompanyCard({ company }: Props) {
  const status = STATUS_CONFIG[company.subscription.status] ?? STATUS_CONFIG.canceled;
  const icon   = TEMPLATE_ICONS[company.templateId] ?? '🏢';
  const isBlocked  = company.subscription.status === 'blocked';
  const isInactive = company.subscription.status === 'inactive';

  const daysLeft = company.subscription.trialEndsAt
    ? Math.max(0, Math.ceil((company.subscription.trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div style={{
      background: 'rgba(255,255,255,.03)',
      border: `1px solid ${isBlocked || isInactive ? 'rgba(239,68,68,.25)' : 'rgba(255,255,255,.09)'}`,
      borderRadius: 16, overflow: 'hidden',
      transition: 'all .18s',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top accent */}
      <div style={{ height: 3, background: company.primaryColor ?? '#0EA5E9' }}/>

      <div style={{ padding: '20px 20px 16px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0, fontSize: 20,
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{icon}</div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.2 }}>
                {company.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.3)', marginTop: 3, fontFamily: 'monospace' }}>
                {company.slug}.factucon.cfd
              </div>
            </div>
          </div>
          {/* Status badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: '0.62rem', fontWeight: 700, padding: '3px 9px',
            borderRadius: 99, background: status.bg, color: status.color,
            textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: status.dot }}/>
            {status.label}
          </div>
        </div>

        {/* Info row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            { icon: '👥', val: `${company.maxUsers} usuario${company.maxUsers !== 1 ? 's' : ''}` },
            { icon: '🧩', val: `${company.modules.length} módulos` },
            { icon: '💰', val: `RD$${company.subscription.planPrice?.toLocaleString()}/mes` },
          ].map(({ icon: i, val }) => (
            <div key={val} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: '0.72rem', color: 'rgba(255,255,255,.4)',
              background: 'rgba(255,255,255,.04)', borderRadius: 6,
              padding: '3px 9px', border: '1px solid rgba(255,255,255,.07)',
            }}>
              <span style={{ fontSize: 12 }}>{i}</span> {val}
            </div>
          ))}
        </div>

        {/* Trial countdown */}
        {company.subscription.status === 'trial' && daysLeft !== null && (
          <div style={{
            fontSize: '0.72rem', padding: '7px 10px', borderRadius: 8, marginBottom: 12,
            background: 'rgba(14,165,233,.08)', border: '1px solid rgba(14,165,233,.2)',
            color: '#38BDF8',
          }}>
            ⭐ {daysLeft > 0 ? `${daysLeft} días de prueba restantes` : 'Período de prueba vencido'}
          </div>
        )}

        {/* Blocked warning */}
        {isBlocked && (
          <div style={{
            fontSize: '0.72rem', padding: '7px 10px', borderRadius: 8, marginBottom: 12,
            background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
            color: '#F87171',
          }}>
            🔒 Sistema bloqueado por pago pendiente
          </div>
        )}

        {/* Inactive warning */}
        {isInactive && (
          <div style={{
            fontSize: '0.72rem', padding: '7px 10px', borderRadius: 8, marginBottom: 12,
            background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)',
            color: '#A78BFA',
          }}>
            💀 Inactivo +30 días · Requiere tarifa de reactivación (RD$500)
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,.06)',
        display: 'flex', gap: 8, background: 'rgba(0,0,0,.1)',
      }}>
        <Link href={`/portal/dashboard/empresa/${company.id}`} style={{
          flex: 1, textAlign: 'center', padding: '7px 12px',
          borderRadius: 9, fontSize: '0.78rem', fontWeight: 600,
          background: '#0EA5E9', color: '#fff', textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(14,165,233,.25)',
        }}>
          Gestionar →
        </Link>
        <a
          href={`https://${company.slug}.factucon.cfd/`}
          target="_blank" rel="noopener noreferrer"
          style={{
            padding: '7px 12px', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600,
            border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
            background: 'transparent',
          }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Abrir
        </a>
      </div>
    </div>
  );
}