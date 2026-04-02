'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface CompanyInfo {
  name:         string;
  primaryColor: string;
  templateId:   string;
  logoUrl?:     string;
}

const TEMPLATE_ICONS: Record<string, string> = {
  pharmacy: '💊', workshop: '🔧', restaurant: '🍽️', grocery: '🏪',
  clinic: '🏥', boutique: '👗', hardware: '🏗️', bookstore: '📚',
  salon: '💈', custom: '⚙️',
};

export default function SistemaLoginPage() {
  const { slug }  = useParams<{ slug: string }>();
  const [company, setCompany]   = useState<CompanyInfo | null>(null);
  const [code,    setCode]      = useState('');
  const [error,   setError]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [blocked, setBlocked]   = useState(false);

  // Cargar info de la empresa por slug
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/sistema/info?slug=${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setCompany(data);
          if (data.status === 'blocked' || data.status === 'inactive') {
            setBlocked(true);
          }
        }
      })
      .catch(() => setError('Error al cargar el sistema'))
      .finally(() => setLoadingInfo(false));
  }, [slug]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(''); setLoading(true);

    try {
      const res  = await fetch('/api/sistema/activate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim().toUpperCase(), slug }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Código inválido');
        return;
      }

      // Guardar sesión del sistema en cookie y redirigir al dashboard
      document.cookie = `sistema-session=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      window.location.href = `/sistema/${slug}/dashboard`;
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const brandColor = company?.primaryColor ?? '#0EA5E9';
  const icon       = TEMPLATE_ICONS[company?.templateId ?? ''] ?? '🏢';

  if (loadingInfo) return <LoadingScreen color={brandColor} />;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060D1F', padding: '24px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>

      {/* Glow */}
      <div style={{ position: 'fixed', width: 500, height: 500, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: `${brandColor}08`, filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }}/>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>

        {/* Logo / nombre empresa */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
            background: brandColor, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '2rem',
            boxShadow: `0 8px 24px ${brandColor}40`,
          }}>
            {company?.logoUrl
              ? <img src={company.logoUrl} alt="" style={{ width: 44, height: 44, objectFit: 'contain' }}/>
              : icon
            }
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 4 }}>
            {company?.name ?? slug}
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>
            Sistema de facturación · Powered by Factucon
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 20, padding: '32px', overflow: 'hidden', position: 'relative',
        }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: brandColor }}/>

          {blocked ? (
            <BlockedMessage color={brandColor} slug={slug} />
          ) : (
            <>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
                Ingresa tu código de acceso
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 24, lineHeight: 1.7 }}>
                Tu administrador te proporcionó un código único para activar tu acceso. Ingrésalo a continuación.
              </p>

              <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Código de activación
                  </label>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="FC-2025-XXXX-XXXX"
                    autoComplete="off"
                    spellCheck={false}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,.06)',
                      border: `1px solid ${error ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.12)'}`,
                      borderRadius: 12, padding: '12px 16px',
                      color: '#F8FAFC', fontSize: '1rem', outline: 'none',
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.08em', textAlign: 'center',
                      transition: 'border-color .13s',
                    }}
                    onFocus={e => e.target.style.borderColor = brandColor}
                    onBlur={e  => e.target.style.borderColor = error ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.12)'}
                  />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, fontSize: '0.78rem', color: '#F87171', textAlign: 'center' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading || !code.trim()}
                  style={{
                    padding: '13px', borderRadius: 12, border: 'none', cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                    background: loading || !code.trim() ? 'rgba(255,255,255,.1)' : brandColor,
                    color: '#fff', fontWeight: 700, fontSize: '0.92rem',
                    fontFamily: 'inherit', transition: 'all .15s',
                    boxShadow: !loading && code.trim() ? `0 4px 16px ${brandColor}40` : 'none',
                  }}>
                  {loading ? 'Verificando...' : 'Acceder al sistema →'}
                </button>
              </form>

              {/* Ejemplo de formato */}
              <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10, textAlign: 'center' }}>
                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.25)', fontFamily: 'monospace' }}>
                  Formato: FC-2025-XXXX-ROLE#
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.68rem', color: 'rgba(255,255,255,.2)' }}>
          ¿Eres el dueño?{' '}
          <a href="https://facturacon.cfd/portal/dashboard" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>
            Ir al portal admin →
          </a>
        </p>
      </div>
    </div>
  );
}

function BlockedMessage({ color, slug }: { color: string; slug: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
        Sistema temporalmente bloqueado
      </h3>
      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.75, marginBottom: 20 }}>
        El administrador de este sistema tiene un pago pendiente. Contacta al dueño del negocio para reactivar el acceso.
      </p>
      <a href="https://facturacon.cfd/portal/dashboard"
        style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' }}>
        Ir al portal admin
      </a>
    </div>
  );
}

function LoadingScreen({ color }: { color: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060D1F' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: `0 4px 16px ${color}40` }}>🏢</div>
        <div style={{ width: 20, height: 20, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}