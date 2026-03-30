'use client';
import { WizardData } from './wizard-shell';
import { TEMPLATES, TemplateId } from '@/lib/types';

interface Props {
  data:     WizardData;
  onUpdate: (p: Partial<WizardData>) => void;
  onNext:   () => void;
}

export function Step1Template({ data, onUpdate, onNext }: Props) {
  function select(t: typeof TEMPLATES[0]) {
    onUpdate({ templateId: t.id, modules: t.defaultModules, primaryColor: t.color });
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
        Elige una plantilla
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 22 }}>
        Cada plantilla viene preconfigurada para tu industria. Podrás personalizar los módulos en el siguiente paso.
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

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onNext} style={{ padding: '10px 28px', borderRadius: 11, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(14,165,233,.3)' }}>
          Continuar →
        </button>
      </div>
    </div>
  );
}