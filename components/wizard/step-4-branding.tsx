'use client';
import { WizardData } from './wizard-shell';

interface Props {
  data: WizardData;
  onUpdate: (p: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const COLORS = ['#0EA5E9','#10B981','#8B5CF6','#EF4444','#F59E0B','#EC4899','#14B8A6','#F97316'];

export function Step4Branding({ data, onUpdate, onNext, onBack }: Props) {
  function handleName(val: string) {
    const slug = val.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-');
    onUpdate({ name: val, slug });
  }

  const canNext = data.name.trim().length >= 3 && data.slug.length >= 2;

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
        Personaliza tu marca
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 24 }}>
        Esta información aparecerá en tu sistema y en tus facturas.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {/* Nombre */}
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nombre del negocio *
          </label>
          <input value={data.name} onChange={e => handleName(e.target.value)}
            placeholder="Ferretería El Progreso"
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }}
          />
          {data.slug && (
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.35)', marginTop: 5, fontFamily: 'monospace' }}>
              Tu sistema: <span style={{ color: '#0EA5E9' }}>{data.slug}.https://factucon.vercel.app/</span>
            </p>
          )}
        </div>

        {/* RNC */}
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            RNC (opcional)
          </label>
          <input value={data.rnc} onChange={e => onUpdate({ rnc: e.target.value })}
            placeholder="101-23456-7"
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', fontFamily: 'monospace' }}
          />
        </div>

        {/* Teléfono y email en grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono</label>
            <input value={data.phone} onChange={e => onUpdate({ phone: e.target.value })}
              placeholder="809-000-0000"
              style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email del negocio</label>
            <input type="email" value={data.email} onChange={e => onUpdate({ email: e.target.value })}
              placeholder="info@minegocio.com"
              style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Color principal
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => onUpdate({ primaryColor: c })}
                style={{ width: 36, height: 36, borderRadius: 10, background: c, border: data.primaryColor === c ? '3px solid #fff' : '3px solid transparent', cursor: 'pointer', transition: 'all .13s', boxShadow: data.primaryColor === c ? `0 0 0 2px ${c}` : 'none' }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ padding: '10px 22px', borderRadius: 11, background: 'rgba(255,255,255,.07)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.88rem', border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer' }}>
          ← Atrás
        </button>
        <button onClick={onNext} disabled={!canNext}
          style={{ padding: '10px 28px', borderRadius: 11, background: canNext ? '#0EA5E9' : 'rgba(255,255,255,.1)', color: canNext ? '#fff' : 'rgba(255,255,255,.3)', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: canNext ? 'pointer' : 'not-allowed', transition: 'all .13s' }}>
          Continuar →
        </button>
      </div>
    </div>
  );
}