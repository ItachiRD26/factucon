'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardData } from './wizard-shell';
import { calculatePrice, getPlanTier } from '@/lib/types';
import { dopToUsd } from '@/lib/paypal/config';

interface Props {
  data: WizardData;
}

export function Step6Payment({ data }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const total    = calculatePrice(data.modules, data.users.length);
  const totalUSD = dopToUsd(total);
  const tier     = getPlanTier(total);

  async function handleConnect() {
    if (!data.companyId || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/paypal/create-subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ companyId: data.companyId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Error al conectar con PayPal');
      if (!d.approveUrl) throw new Error('PayPal no devolvió un enlace de aprobación');
      window.location.href = d.approveUrl;
    } catch (e: any) {
      setError(e.message ?? 'Ocurrió un error. Intenta de nuevo.');
      setLoading(false);
    }
  }

  function handleLater() {
    router.push(`/portal/dashboard/empresa/${data.companyId}`);
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
          ¡Tu sistema ya está listo!
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.4)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
          <strong style={{ color: '#F8FAFC' }}>{data.name}</strong> ya está disponible en{' '}
          <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{data.slug}.facturacon.cfd</span>.
          Solo falta vincular tu método de pago para activar la facturación automática.
        </p>
      </div>

      <div style={{ background: 'rgba(14,165,233,.05)', border: '1px solid rgba(14,165,233,.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38BDF8' }}>Plan mensual</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC' }}>RD${total.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.4)' }}>≈ US${totalUSD}/mes</div>
          </div>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, marginTop: 12 }}>
          PayPal procesa el cobro en su equivalente en dólares. Tienes{' '}
          <strong style={{ color: '#F8FAFC' }}>14 días gratis</strong> — no se te cobrará nada ahora.
          El cobro automático (≈ US${totalUSD}) inicia cuando termine el período de prueba. Puedes
          cancelar cuando quieras desde Facturación.
        </p>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.7, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(14,165,233,.15)' }}>
          Plan <strong style={{ color: '#38BDF8' }}>{tier.name}</strong> · incluye{' '}
          <strong style={{ color: '#F8FAFC' }}>{tier.comprobanteLimit.toLocaleString()} comprobantes/mes</strong>.
          Cada comprobante extra cuesta RD${tier.overageRate} y se cobra en el ciclo siguiente.
        </p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, fontSize: '0.78rem', color: '#F87171', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <button onClick={handleConnect} disabled={loading}
        style={{ width: '100%', padding: '13px', borderRadius: 11, background: loading ? 'rgba(14,165,233,.4)' : '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.92rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 16px rgba(14,165,233,.35)', marginBottom: 12, fontFamily: 'inherit' }}>
        {loading ? 'Conectando con PayPal...' : '🔗 Conectar con PayPal'}
      </button>

      <button onClick={handleLater} disabled={loading}
        style={{ width: '100%', padding: '10px', borderRadius: 11, background: 'transparent', color: 'rgba(255,255,255,.4)', fontWeight: 600, fontSize: '0.8rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
        Configurar el pago más tarde →
      </button>
    </div>
  );
}
