'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCompany } from '@/lib/db/companies';
import { Company } from '@/lib/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  trial:    { label: 'Trial activo',    color: '#38BDF8', bg: 'rgba(14,165,233,.1)',  desc: 'Acceso completo durante el período de prueba' },
  active:   { label: 'Suscripción activa', color: '#34D399', bg: 'rgba(16,185,129,.1)', desc: 'Tu sistema está activo y funcionando' },
  past_due: { label: 'Pago tardío',     color: '#FCD34D', bg: 'rgba(245,158,11,.1)',  desc: 'Pago pendiente. Tienes 2 días para pagar antes del bloqueo' },
  blocked:  { label: 'Sistema bloqueado', color: '#F87171', bg: 'rgba(239,68,68,.1)', desc: 'El sistema está bloqueado por falta de pago' },
  inactive: { label: 'Inactivo +30 días', color: '#A78BFA', bg: 'rgba(139,92,246,.1)', desc: 'Se requiere tarifa de reactivación de RD$500' },
  canceled: { label: 'Cancelado',       color: '#94A3B8', bg: 'rgba(148,163,184,.1)', desc: 'La suscripción fue cancelada' },
};

export default function FacturacionPage() {
  const { id }    = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCompany(id).then(setCompany).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,.4)' }}>Cargando...</div>;
  if (!company) return null;

  const sub    = company.subscription;
  const status = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.canceled;
  const trialDaysLeft = sub.trialEndsAt
    ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <Link href={`/portal/dashboard/empresa/${id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.4)', fontSize: '0.78rem', textDecoration: 'none', marginBottom: 20 }}>
        ← {company.name}
      </Link>

      <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 24 }}>
        Facturación y suscripción
      </h1>

      {/* Estado */}
      <div style={{ background: status.bg, border: `1px solid ${status.color}40`, borderRadius: 14, padding: '18px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${status.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          {sub.status === 'active' ? '✅' : sub.status === 'trial' ? '⭐' : sub.status === 'blocked' ? '🔒' : sub.status === 'inactive' ? '💀' : '⚠️'}
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: status.color, marginBottom: 3 }}>{status.label}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.45)' }}>{status.desc}</div>
          {sub.status === 'trial' && trialDaysLeft !== null && (
            <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: 4, fontWeight: 600 }}>
              {trialDaysLeft > 0 ? `${trialDaysLeft} días restantes` : 'Trial vencido'}
            </div>
          )}
        </div>
      </div>

      {/* Detalles */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '20px', marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 14 }}>Detalles del plan</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Plan mensual',      `RD$${sub.planPrice?.toLocaleString()}/mes`],
            ['Usuarios',          `${company.maxUsers} usuario${company.maxUsers !== 1 ? 's' : ''}`],
            ['Módulos activos',   `${company.modules.length} módulos`],
            ['Tarifa reactivación', `RD$${sub.reactivationFee} (si +30 días inactivo)`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'rgba(255,255,255,.4)' }}>{k}</span>
              <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 10 }}>
        {(sub.status === 'blocked' || sub.status === 'inactive' || sub.status === 'trial' || sub.status === 'past_due') && (
          <button style={{ flex: 1, padding: '11px', borderRadius: 11, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(14,165,233,.3)' }}>
            {sub.status === 'inactive' ? `Reactivar (RD$${sub.reactivationFee} + plan)` : 'Pagar ahora con PayPal'}
          </button>
        )}
        {sub.status === 'active' && (
          <button style={{ padding: '11px 20px', borderRadius: 11, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#F87171', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
            Cancelar suscripción
          </button>
        )}
      </div>
    </div>
  );
}