'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DGII_AMBIENTES, TIPOS_ECF, type DgiiAmbiente, type TipoECF } from '@/lib/dgii/types';
import { hasPaidPlan } from '@/lib/subscriptions/gates';
import type { SubscriptionStatus } from '@/lib/types';

interface DgiiConfigState {
  enabled:            boolean;
  ambiente:           DgiiAmbiente;
  rnc:                string;
  actividadEconomica: string;
  certificadoCargado: boolean;
  vencimientos:       Partial<Record<TipoECF, string>>;
}

const EMPTY: DgiiConfigState = {
  enabled:            false,
  ambiente:           'testecf',
  rnc:                '',
  actividadEconomica: '',
  certificadoCargado: false,
  vencimientos:       {},
};

export default function DgiiConfigPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const [config,  setConfig]  = useState<DgiiConfigState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('trial');
  const canCertify = hasPaidPlan(subscriptionStatus);

  // Certificado .p12
  const [certFile,     setCertFile]     = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [certError,    setCertError]    = useState('');

  // Probar conexión
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function load() {
    setLoading(true);
    fetch(`/api/portal/dgii?companyId=${companyId}`)
      .then(r => r.json())
      .then(d => {
        if (d.dgiiConfig) setConfig(d.dgiiConfig);
        if (d.subscriptionStatus) setSubscriptionStatus(d.subscriptionStatus);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [companyId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/portal/dgii', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ companyId, ...config }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSuccess('Configuración guardada');
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function handleUploadCert(e: React.FormEvent) {
    e.preventDefault();
    if (!certFile || !certPassword) { setCertError('Selecciona el archivo .p12 y escribe la contraseña'); return; }
    setUploading(true); setCertError(''); setTestResult(null);
    try {
      const form = new FormData();
      form.append('companyId', companyId);
      form.append('password', certPassword);
      form.append('file', certFile);
      const res = await fetch('/api/portal/dgii/cert', { method: 'POST', body: form });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setConfig(c => ({ ...c, certificadoCargado: true }));
      setCertFile(null); setCertPassword('');
    } catch (e: any) {
      setCertError(e.message ?? 'Error al subir el certificado');
    } finally { setUploading(false); }
  }

  async function handleTest() {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/portal/dgii/test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ companyId }),
      });
      const d = await res.json();
      setTestResult(d);
    } catch (e: any) {
      setTestResult({ ok: false, error: e.message ?? 'Error desconocido' });
    } finally { setTesting(false); }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Link href={`/portal/dashboard/empresa/${companyId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.4)', fontSize: '0.78rem', textDecoration: 'none', marginBottom: 20 }}>
        ← Empresa
      </Link>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 3 }}>DGII / e-CF</h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>Configuración de facturación electrónica</p>
      </div>

      {!canCertify && (
        <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FCD34D', marginBottom: 6 }}>🔒 Necesitas tu plan activo para certificarte</h3>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.7, marginBottom: 12 }}>
            Certificarte ante la DGII tiene un costo operativo, por eso lo habilitamos solo para empresas
            con el plan pagado (estás en período de prueba). Puedes seguir usando POS, inventario y el
            resto del sistema libremente durante tu trial.
          </p>
          <Link href={`/portal/dashboard/empresa/${companyId}/facturacion`}
            style={{ display: 'inline-block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', background: '#F59E0B', padding: '8px 16px', borderRadius: 9, textDecoration: 'none' }}>
            Activar mi plan →
          </Link>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Activar/desactivar e-CF */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, opacity: canCertify ? 1 : 0.5 }}>
          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 3 }}>Facturación electrónica (e-CF)</h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.4)' }}>
              {config.enabled ? 'Activa — las ventas emiten e-CF automáticamente' : 'Inactiva — el sistema usa NCF tradicional'}
            </p>
          </div>
          <button type="button" disabled={!canCertify} onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
            style={{ width: 50, height: 28, borderRadius: 99, border: 'none', cursor: canCertify ? 'pointer' : 'not-allowed', position: 'relative', flexShrink: 0, background: config.enabled ? '#0EA5E9' : 'rgba(255,255,255,.15)', transition: 'background .15s' }}>
            <span style={{ position: 'absolute', top: 3, left: config.enabled ? 25 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
          </button>
        </div>

        {/* Datos fiscales */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 14 }}>Datos fiscales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="RNC certificado ante DGII *" value={config.rnc} onChange={v => setConfig(c => ({ ...c, rnc: v }))} placeholder="131234567" />
            <Field label="Actividad económica *" value={config.actividadEconomica} onChange={v => setConfig(c => ({ ...c, actividadEconomica: v }))} placeholder="Comercio al por menor" />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={LABEL_STYLE}>Ambiente DGII</label>
              <select value={config.ambiente} onChange={e => setConfig(c => ({ ...c, ambiente: e.target.value as DgiiAmbiente }))}
                style={SELECT_STYLE}>
                {DGII_AMBIENTES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Vencimientos por tipo de e-CF */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Vencimientos de secuencias autorizadas</h3>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.35)', marginBottom: 14 }}>
            Fecha de vencimiento autorizada por la DGII para cada tipo de e-CF (ver autorización en la Oficina Virtual).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TIPOS_ECF.map(t => (
              <div key={t.codigo} style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.7)' }}>{t.label}</span>
                <input type="date" value={config.vencimientos[t.codigo] ?? ''}
                  onChange={e => setConfig(c => ({ ...c, vencimientos: { ...c.vencimientos, [t.codigo]: e.target.value } }))}
                  style={{ ...INPUT_STYLE, padding: '7px 10px' }} />
              </div>
            ))}
          </div>
        </div>

        {error   && <Banner type="error">{error}</Banner>}
        {success && <Banner type="success">{success}</Banner>}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving}
            style={{ padding: '10px 24px', borderRadius: 10, background: saving ? 'rgba(14,165,233,.4)' : '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>

      {/* Certificado digital */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '20px', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>Certificado digital (.p12)</h3>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: config.certificadoCargado ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: config.certificadoCargado ? '#34D399' : '#F59E0B' }}>
            {config.certificadoCargado ? '✅ Cargado' : '⚠️ No cargado'}
          </span>
        </div>

        <form onSubmit={handleUploadCert} style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: canCertify ? 1 : 0.5 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL_STYLE}>Archivo .p12</label>
              <input type="file" accept=".p12,.pfx" disabled={!canCertify} onChange={e => setCertFile(e.target.files?.[0] ?? null)}
                style={{ ...INPUT_STYLE, padding: '8px 10px' }} />
            </div>
            <Field label="Contraseña del certificado" type="password" value={certPassword} onChange={setCertPassword} placeholder="••••••••" disabled={!canCertify} />
          </div>
          {certError && <Banner type="error">{certError}</Banner>}
          <div>
            <button type="submit" disabled={uploading || !canCertify}
              style={{ padding: '9px 20px', borderRadius: 10, background: uploading ? 'rgba(14,165,233,.4)' : '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: (uploading || !canCertify) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {uploading ? 'Subiendo...' : 'Subir certificado'}
            </button>
          </div>
        </form>

        {config.certificadoCargado && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <button type="button" onClick={handleTest} disabled={testing}
              style={{ padding: '9px 20px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.85rem', cursor: testing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {testing ? 'Probando...' : 'Probar conexión con DGII'}
            </button>
            {testResult && (
              <div style={{ marginTop: 10 }}>
                <Banner type={testResult.ok ? 'success' : 'error'}>
                  {testResult.ok ? '✅ Conexión exitosa — token obtenido' : `❌ ${testResult.error ?? 'Error desconocido'}`}
                </Banner>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
};

const SELECT_STYLE: React.CSSProperties = { ...INPUT_STYLE };

function Field({ label, value, onChange, placeholder, type = 'text', disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        style={INPUT_STYLE}
        onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
        onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.12)')}
      />
    </div>
  );
}

function Banner({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  const ok = type === 'success';
  return (
    <div style={{
      padding: '9px 12px', borderRadius: 9, fontSize: '0.78rem',
      background: ok ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)',
      border:     `1px solid ${ok ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`,
      color:      ok ? '#34D399' : '#F87171',
    }}>
      {children}
    </div>
  );
}
