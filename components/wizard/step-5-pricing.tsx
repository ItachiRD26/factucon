'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { WizardData } from './wizard-shell';
import { PreviewModal } from './preview-modal';
import { calculatePlanPrice, getModulesForBusiness, PLAN_TIERS, PRICING, TEMPLATES } from '@/lib/types';

interface Props {
  data:          WizardData;
  onBack:        () => void;
  onProvisioned: (companyId: string) => void;
}

const MODULE_LABELS: Record<string, string> = {
  pos:                 'POS',
  inventory:           'Inventario',
  quotes:              'Cotizaciones',
  reports:             'Reportes',
  ecf:                 'e-CF DGII',
  clients:             'CRM Clientes',
  purchases:           'Compras',
  accounts_receivable: 'Cuentas × cobrar',
  multi_warehouse:     'Multi-almacén',
};

export function Step5Pricing({ data, onBack, onProvisioned }: Props) {
  const { user }   = useAuth();
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const tier       = PLAN_TIERS.find(t => t.id === data.planId) ?? PLAN_TIERS[0];
  const total      = calculatePlanPrice(tier.id, data.users.length);
  const extraUsers = Math.max(0, data.users.length - 1);
  const modules    = getModulesForBusiness(data.businessKind);
  const template   = TEMPLATES.find(t => t.id === data.templateId);

  async function handleActivate() {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/provision', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ownerId: user.uid }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Error al crear el sistema');
      }
      const { companyId } = await res.json();
      onProvisioned(companyId);
    } catch (e: any) {
      setError(e.message ?? 'Ocurrió un error. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
        Resumen y activación
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 24 }}>
        Revisa tu configuración antes de activar el sistema.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Info empresa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Tu empresa</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 3 }}>{data.name || '—'}</div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#0EA5E9' }}>{data.slug}.facturacon.cfd</div>
            {data.rnc && <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.35)', marginTop: 3 }}>RNC: {data.rnc}</div>}
          </div>

          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Plantilla</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>{template?.icon}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>{template?.name}</span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)' }}>· {data.businessKind}</span>
            </div>
            <button type="button" onClick={() => setShowPreview(true)}
              style={{ marginTop: 10, fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
              👁️ Ver preview de mi sistema
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Usuarios ({data.users.length})
            </div>
            {data.users.map((u, i) => (
              <div key={i} style={{ fontSize: '0.78rem', color: '#F8FAFC', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{u.label}</span>
                <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.68rem' }}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose precio */}
        <div style={{ background: 'rgba(14,165,233,.05)', border: '1px solid rgba(14,165,233,.2)', borderRadius: 12, padding: '18px' }}>
          <div style={{ fontSize: '0.68rem', color: '#38BDF8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Desglose del precio
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <PriceRow label={`Plan ${tier.name} (1 usuario)`} val={`RD$${tier.price.toLocaleString()}`} />
            {extraUsers > 0 && (
              <PriceRow label={`${extraUsers} usuario${extraUsers > 1 ? 's' : ''} extra`} val={`+RD$${(extraUsers * PRICING.pricePerUser).toLocaleString()}`} />
            )}
          </div>
          <div style={{ borderTop: '1px solid rgba(14,165,233,.2)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38BDF8' }}>Total mensual</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC' }}>RD${total.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', marginTop: 4 }}>
              Primeros 14 días gratis. Luego RD${total.toLocaleString()}/mes.
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(14,165,233,.2)', fontSize: '0.7rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.7 }}>
            Plan <strong style={{ color: '#38BDF8' }}>{tier.name}</strong> · incluye{' '}
            <strong style={{ color: '#F8FAFC' }}>{tier.comprobanteLimit.toLocaleString()} comprobantes/mes</strong>.
            Cada comprobante extra cuesta RD${tier.overageRate} y se cobra en el ciclo siguiente.
          </div>
        </div>
      </div>

      {/* Módulos incluidos (automáticos según tipo de negocio) */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Incluido en tu sistema ({modules.length} módulos)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {modules.map(m => (
            <span key={m} style={{ fontSize: '0.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: 'rgba(14,165,233,.1)', color: '#38BDF8', border: '1px solid rgba(14,165,233,.2)' }}>
              {MODULE_LABELS[m] ?? m}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, fontSize: '0.78rem', color: '#F87171', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack}
          style={{ padding: '10px 22px', borderRadius: 11, background: 'rgba(255,255,255,.07)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.88rem', border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer' }}>
          ← Atrás
        </button>
        <button onClick={handleActivate} disabled={loading}
          style={{ padding: '12px 32px', borderRadius: 11, background: loading ? 'rgba(14,165,233,.4)' : '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.92rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 16px rgba(14,165,233,.35)' }}>
          {loading ? 'Creando sistema...' : '🚀 Crear mi sistema'}
        </button>
      </div>
      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.25)', textAlign: 'center', marginTop: 12 }}>
        14 días gratis · Cancela cuando quieras · Sin contrato
      </p>

      {showPreview && <PreviewModal data={data} onClose={() => setShowPreview(false)} />}
    </div>
  );
}

function PriceRow({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
      <span style={{ color: 'rgba(255,255,255,.5)' }}>{label}</span>
      <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{val}</span>
    </div>
  );
}
