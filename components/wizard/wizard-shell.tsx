'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Step1Template } from './step-1-template';
import { Step2Modules }  from './step-2-modules';
import { Step3Users }    from './step-3-users';
import { Step4Branding } from './step-4-branding';
import { Step5Pricing }  from './step-5-pricing';
import { Step6Payment }  from './step-6-payment';
import { ModuleId, TemplateId, TEMPLATES } from '@/lib/types';

export interface WizardData {
  templateId:   TemplateId;
  modules:      ModuleId[];
  users:        { role: string; label: string }[];
  name:         string;
  slug:         string;
  rnc:          string;
  phone:        string;
  email:        string;
  primaryColor: string;
  companyId?:   string;
}

const STEPS = [
  { num: 1, label: 'Plantilla' },
  { num: 2, label: 'Módulos'   },
  { num: 3, label: 'Usuarios'  },
  { num: 4, label: 'Tu marca'  },
  { num: 5, label: 'Crear sistema' },
  { num: 6, label: 'Pago'      },
];

const INITIAL: WizardData = {
  templateId:   'custom',
  modules:      ['pos', 'inventory', 'reports'],
  users:        [{ role: 'owner', label: 'Propietario' }],
  name:         '',
  slug:         '',
  rnc:          '',
  phone:        '',
  email:        '',
  primaryColor: '#0EA5E9',
};

export function WizardShell() {
  const [step, setStep]   = useState(1);
  const [data, setData]   = useState<WizardData>(INITIAL);
  const router            = useRouter();

  function next() { setStep(s => Math.min(s + 1, 6)); }
  function back() { setStep(s => Math.max(s - 1, 1)); }
  function update(partial: Partial<WizardData>) {
    setData(d => ({ ...d, ...partial }));
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 4 }}>
          Crear nuevo sistema
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.35)' }}>
          Configura tu sistema de facturación personalizado en 6 pasos
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36, gap: 0 }}>
        {STEPS.map((s, i) => {
          const done   = step > s.num;
          const active = step === s.num;
          return (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 800,
                  background: done ? '#10B981' : active ? '#0EA5E9' : 'rgba(255,255,255,.08)',
                  color: done || active ? '#fff' : 'rgba(255,255,255,.3)',
                  border: active ? '2px solid rgba(14,165,233,.5)' : '2px solid transparent',
                  transition: 'all .2s',
                }}>
                  {done ? '✓' : s.num}
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: active ? '#0EA5E9' : done ? '#10B981' : 'rgba(255,255,255,.25)', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? '#10B981' : 'rgba(255,255,255,.08)', margin: '0 8px', marginBottom: 22, transition: 'background .2s' }}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: '28px' }}>
        {step === 1 && <Step1Template data={data} onUpdate={update} onNext={next} />}
        {step === 2 && <Step2Modules  data={data} onUpdate={update} onNext={next} onBack={back} />}
        {step === 3 && <Step3Users    data={data} onUpdate={update} onNext={next} onBack={back} />}
        {step === 4 && <Step4Branding data={data} onUpdate={update} onNext={next} onBack={back} />}
        {step === 5 && (
          <Step5Pricing
            data={data}
            onBack={back}
            onProvisioned={companyId => { update({ companyId }); next(); }}
          />
        )}
        {step === 6 && <Step6Payment data={data} />}
      </div>
    </div>
  );
}