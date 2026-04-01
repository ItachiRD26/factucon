'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCompany } from '@/lib/db/companies';
import { getCodesByCompany } from '@/lib/db/codes';
import { Company, ActivationCode } from '@/lib/types';

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
const TEMPLATE_ICONS: Record<string, string> = {
  pharmacy: '💊', workshop: '🔧', restaurant: '🍽️', grocery: '🏪',
  clinic: '🏥', boutique: '👗', hardware: '🏗️', bookstore: '📚',
  salon: '💈', custom: '⚙️',
};

export default function EmpresaDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [codes,   setCodes]   = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCompany(id), getCodesByCompany(id)])
      .then(([c, co]) => { setCompany(c); setCodes(co); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,.3)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!company) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
      <p style={{ color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>Empresa no encontrada</p>
      <Link href="/portal/dashboard" style={{ color: '#0EA5E9', fontSize: '0.82rem' }}>← Volver al dashboard</Link>
    </div>
  );

  const statusColor = STATUS_COLOR[company.subscription.status] ?? '#94A3B8';
  const statusLabel = STATUS_LABEL[company.subscription.status] ?? company.subscription.status;
  const icon = TEMPLATE_ICONS[company.templateId] ?? '🏢';

  const daysLeft = company.subscription.trialEndsAt
    ? Math.max(0, Math.ceil((company.subscription.trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Back */}
      <Link href="/portal/dashboard"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.4)', fontSize: '0.78rem', textDecoration: 'none', marginBottom: 20 }}>
        ← Mis empresas
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: company.primaryColor ?? '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 4 }}>
              {company.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,.35)' }}>
                {company.slug}.factucon.cfd
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${statusColor}20`, color: statusColor }}>
                ● {statusLabel}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`https://${company.slug}.factucon.cfd`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600, color: '#0EA5E9', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(14,165,233,.3)', background: 'rgba(14,165,233,.08)', textDecoration: 'none' }}>
            Abrir sistema ↗
          </a>
        </div>
      </div>

      {/* Trial banner */}
      {company.subscription.status === 'trial' && daysLeft !== null && (
        <div style={{ padding: '12px 16px', background: 'rgba(14,165,233,.08)', border: '1px solid rgba(14,165,233,.2)', borderRadius: 12, marginBottom: 16, fontSize: '0.78rem', color: '#38BDF8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⭐ {daysLeft > 0 ? `${daysLeft} días de prueba restantes` : 'Período de prueba vencido'}</span>
          <Link href={`/portal/dashboard/empresa/${company.id}/facturacion`}
            style={{ color: '#0EA5E9', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>
            Ver planes →
          </Link>
        </div>
      )}

      {/* Blocked banner */}
      {(company.subscription.status === 'blocked' || company.subscription.status === 'inactive') && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 12, marginBottom: 16, fontSize: '0.78rem', color: '#F87171', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🔒 Sistema bloqueado por falta de pago</span>
          <Link href={`/portal/dashboard/empresa/${company.id}/facturacion`}
            style={{ color: '#F87171', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', border: '1px solid rgba(239,68,68,.3)', padding: '4px 12px', borderRadius: 8 }}>
            Pagar ahora →
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          ['💰', 'Plan mensual', `RD$${company.subscription.planPrice?.toLocaleString()}/mes`],
          ['👥', 'Usuarios', `${company.maxUsers} usuario${company.maxUsers !== 1 ? 's' : ''}`],
          ['🧩', 'Módulos', `${company.modules.length} activos`],
          ['🔑', 'Códigos', `${codes.length} generados`],
        ].map(([icon, label, val]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px' }}>
            <div style={{ fontSize: '1.3rem', marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          ['🔑 Usuarios y códigos', `/portal/dashboard/empresa/${company.id}/usuarios`],
          ['💳 Facturación',        `/portal/dashboard/empresa/${company.id}/facturacion`],
        ].map(([label, href]) => (
          <Link key={href as string} href={href as string}
            style={{ padding: '9px 18px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,.7)', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', textDecoration: 'none', transition: 'all .13s' }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Módulos activos */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '20px', marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 14 }}>🧩 Módulos activos</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {company.modules.map(m => (
            <span key={m} style={{ fontSize: '0.72rem', fontWeight: 600, padding: '4px 12px', borderRadius: 8, background: 'rgba(14,165,233,.1)', color: '#38BDF8', border: '1px solid rgba(14,165,233,.2)' }}>
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Códigos de activación */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC' }}>🔑 Códigos de activación</h3>
          <Link href={`/portal/dashboard/empresa/${company.id}/usuarios`}
            style={{ fontSize: '0.75rem', color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>
            Ver todos →
          </Link>
        </div>
        {codes.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>No hay códigos generados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {codes.slice(0, 3).map(c => (
              <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,.07)' }}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0EA5E9' }}>{c.code}</span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)', marginLeft: 12 }}>{c.label}</span>
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,.1)', color: '#34D399' }}>
                  {c.role}
                </span>
              </div>
            ))}
            {codes.length > 3 && (
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>
                +{codes.length - 3} más
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}