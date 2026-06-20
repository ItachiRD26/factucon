'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginPage() {
  const { login, loginGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [busy,        setBusy]        = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Redirige solo cuando la sesión (cookie + portalUser) ya terminó de
  // cargar — hacerlo inmediatamente después de login()/loginGoogle() causa
  // una condición de carrera: la cookie que protege /portal/dashboard del
  // lado servidor todavía se está escribiendo de forma asíncrona.
  useEffect(() => {
    if (!loading && user) router.replace('/portal/dashboard');
  }, [user, loading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await login(email, password);
      setRedirecting(true);
    } catch (err: any) {
      setError(friendlyError(err.code));
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(''); setBusy(true);
    try {
      await loginGoogle();
      setRedirecting(true);
    } catch (err: any) {
      setError(friendlyError(err.code));
      setBusy(false);
    }
  }

  if (loading) return <FullLoader />;
  if (redirecting) return <FullLoader />;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'var(--brand)', boxShadow: '0 4px 14px rgba(14,165,233,.4)' }}>
              <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--t1)' }}>
              Factu<span style={{ color: 'var(--brand)' }}>con</span>
            </span>
          </div>

          <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--t1)' }}>
            Bienvenido de vuelta
          </h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--t2)' }}>
            Ingresa tus credenciales para acceder al portal
          </p>

          {/* Google */}
          <button onClick={handleGoogle} disabled={busy}
            className="w-full flex items-center justify-center gap-3 mb-6 rounded-xl border font-semibold text-sm py-3 transition-all hover:shadow-md"
            style={{ background: 'var(--surface)', borderColor: 'var(--border2)', color: 'var(--t1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border2)' }}/>
            <span className="text-xs" style={{ color: 'var(--t3)' }}>o con tu correo</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border2)' }}/>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: 'var(--t2)' }}>
                Correo electrónico
              </label>
              <input type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="juan@miempresa.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface2)', color: 'var(--t1)',
                  border: '1px solid var(--border2)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--t2)' }}>Contraseña</label>
                <Link href="/auth/forgot-password"
                  className="text-xs font-semibold"
                  style={{ color: 'var(--brand)' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface2)', color: 'var(--t1)',
                  border: '1px solid var(--border2)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: 'rgba(239,68,68,.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
              style={{
                background: busy ? 'var(--t3)' : 'var(--brand)',
                boxShadow: busy ? 'none' : '0 2px 12px rgba(14,165,233,.35)',
              }}>
              {busy ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--t2)' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="font-bold" style={{ color: 'var(--brand)' }}>
              Regístrate gratis →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right panel (branding) ── */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-between p-10"
        style={{ background: '#0F172A', borderLeft: '1px solid rgba(255,255,255,.07)' }}>
        <div/>
        <div>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Factura con inteligencia.<br/>
            <span style={{ color: 'var(--brand)' }}>Gestiona con confianza.</span>
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,.45)', lineHeight: 1.8 }}>
            El sistema de facturación diseñado para emprendedores dominicanos. NCF, ITBIS y e-CF DGII — todo integrado y personalizable.
          </p>
          <div className="space-y-3">
            {[
              { icon: '🧾', title: 'Facturación electrónica DGII', sub: 'NCF y e-CF integrados al 100%' },
              { icon: '🛒', title: 'Punto de venta (POS)',          sub: 'Rápido, simple, sin errores' },
              { icon: '🧩', title: 'Plantillas por industria',      sub: 'Farmacia, taller, restaurante y más' },
              { icon: '🤖', title: 'Asistente IA incluido',         sub: 'Responde tus dudas del sistema' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'rgba(14,165,233,.12)' }}>{f.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,.4)' }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,.2)' }}>
          © 2025 Factucon · Hecho para la República Dominicana
        </p>
      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential':      'Correo o contraseña incorrectos.',
    'auth/user-not-found':          'No existe una cuenta con ese correo.',
    'auth/wrong-password':          'Contraseña incorrecta.',
    'auth/too-many-requests':       'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed':  'Error de red. Verifica tu conexión.',
    'auth/popup-closed-by-user':    'Cerraste la ventana de Google.',
  };
  return map[code] ?? 'Ocurrió un error. Intenta de nuevo.';
}

function FullLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--brand)' }}>
          <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin-slow"
          style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}/>
      </div>
    </div>
  );
}