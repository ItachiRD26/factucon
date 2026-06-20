'use client';
import { WizardData } from './wizard-shell';
import { TEMPLATES, BusinessKind } from '@/lib/types';

interface Props {
  data:     WizardData;
  onUpdate: (p: Partial<WizardData>) => void;
  onNext:   () => void;
}

const BUSINESS_KIND_OPTIONS: { id: BusinessKind; label: string }[] = [
  { id: 'productos', label: 'Productos' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'ambos',     label: 'Ambos' },
];

export function Step1Template({ data, onUpdate, onNext }: Props) {
  const selectedTemplate = TEMPLATES.find(t => t.id === data.templateId);

  function select(t: typeof TEMPLATES[0]) {
    onUpdate({ templateId: t.id, businessKind: t.businessKind, primaryColor: t.color });
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
        Elige una plantilla
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 22 }}>
        Cada plantilla viene preconfigurada para tu industria — terminología, unidades de medida y
        el set completo de facturación electrónica, listo desde el primer momento.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 28 }}>
        {TEMPLATES.map(t => {
          const selected = data.templateId === t.id;
          return (
            <button key={t.id} onClick={() => select(t)} style={{
              background: selected ? `${t.color}18` : 'rgba(255,255,255,.04)',
              border: `1.5px solid ${selected ? t.color : 'rgba(255,255,255,.08)'}`,
              borderRadius: 14, padding: '16px 10px', cursor: 'pointer',
              textAlign: 'center', transition: 'all .15s',
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: selected ? '#F8FAFC' : 'rgba(255,255,255,.6)', marginBottom: 3 }}>{t.name}</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.3)', lineHeight: 1.4 }}>{t.description}</div>
              {selected && (
                <div style={{ marginTop: 8, width: 20, height: 20, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px auto 0', fontSize: 10, color: '#fff' }}>✓</div>
              )}
            </button>
          );
        })}
      </div>

      {selectedTemplate && (
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ¿Tu negocio vende productos, servicios, o ambos?
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {BUSINESS_KIND_OPTIONS.map(opt => {
              const active = data.businessKind === opt.id;
              return (
                <button key={opt.id} onClick={() => onUpdate({ businessKind: opt.id })}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${active ? '#0EA5E9' : 'rgba(255,255,255,.1)'}`, background: active ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.04)', color: active ? '#38BDF8' : 'rgba(255,255,255,.5)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.3)', marginTop: 8 }}>
            Precargado según tu plantilla — cámbialo si tu negocio es distinto. Si vendes productos,
            tu sistema incluye POS e inventario; los servicios usan un catálogo de precios simple.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onNext} style={{ padding: '10px 28px', borderRadius: 11, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(14,165,233,.3)' }}>
          Continuar →
        </button>
      </div>
    </div>
  );
}