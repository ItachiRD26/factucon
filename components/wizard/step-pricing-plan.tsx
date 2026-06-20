'use client';
import { WizardData } from './wizard-shell';
import { PLAN_TIERS, PlanId } from '@/lib/types';

interface Props {
  data:     WizardData;
  onUpdate: (p: Partial<WizardData>) => void;
  onNext:   () => void;
  onBack:   () => void;
}

const PLAN_INFO: Record<PlanId, { tagline: string }> = {
  starter:    { tagline: 'Para pequeños negocios que están empezando.' },
  pro:        { tagline: 'Para negocios en crecimiento con más volumen.' },
  business:   { tagline: 'La solución completa para empresas establecidas.' },
  enterprise: { tagline: 'Para cadenas y negocios de alto volumen.' },
};

export function StepPricingPlan({ data, onUpdate, onNext, onBack }: Props) {
  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
        Elige tu plan
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 22 }}>
        Cada plan incluye un número de comprobantes (facturas) al mes. Si lo superas, cada
        comprobante extra tiene un cargo fijo que se suma a tu siguiente cobro — tu sistema sigue
        funcionando sin interrupciones.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 28 }}>
        {PLAN_TIERS.map(tier => {
          const selected = data.planId === tier.id;
          return (
            <button key={tier.id} onClick={() => onUpdate({ planId: tier.id })}
              style={{
                textAlign: 'left', background: selected ? 'rgba(14,165,233,.08)' : 'rgba(255,255,255,.03)',
                border: `1.5px solid ${selected ? '#0EA5E9' : 'rgba(255,255,255,.08)'}`,
                borderRadius: 16, padding: '18px 20px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F8FAFC' }}>{tier.name}</span>
                {selected && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#38BDF8' }}>✓ SELECCIONADO</span>}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 2 }}>
                {tier.id === 'enterprise' ? 'Desde ' : ''}RD${tier.price.toLocaleString()}
                <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'rgba(255,255,255,.4)' }}>/mes</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>{PLAN_INFO[tier.id].tagline}</p>
              <div style={{ fontSize: '0.7rem', color: '#38BDF8' }}>
                🧾 {tier.comprobanteLimit.toLocaleString()} comprobantes/mes · excedente RD${tier.overageRate}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ padding: '10px 22px', borderRadius: 11, background: 'rgba(255,255,255,.07)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.88rem', border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer' }}>
          ← Atrás
        </button>
        <button onClick={onNext} style={{ padding: '10px 28px', borderRadius: 11, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(14,165,233,.3)' }}>
          Continuar →
        </button>
      </div>
    </div>
  );
}
