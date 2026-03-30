'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

export default function RegisterPage() {
  const { register, loginGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [error,     setError]     = useState('');
  const [busy,      setBusy]      = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6)    { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setBusy(true);
    try {
      await register(email, password, name);
      router.push('/portal/dashboard');
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(''); setBusy(true);
    try {
      await loginGoogle();
      router.push('/portal/dashboard');
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
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

        {/* Card */}
        <div className="rounded-2xl p-8" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--sh-md)',
        }}>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--t1)' }}>
            Crea tu cuenta
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--t2)' }}>
            Registra tu cuenta personal — luego puedes crear múltiples empresas.
          </p>

          {/* Google */}
          <button onClick={handleGoogle} disabled={busy}
            className="w-full flex items-center justify-center gap-3 mb-5 rounded-xl border font-semibold text-sm py-3 transition-all hover:shadow-md"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border2)', color: 'var(--t1)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border2)' }}/>
            <span className="text-xs" style={{ color: 'var(--t3)' }}>o con tu correo</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border2)' }}/>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {[
              { label: 'Nombre completo', type: 'text',     val: name,      set: setName,      ph: 'Juan Rodríguez',        ac: 'name' },
              { label: 'Correo electrónico', type: 'email', val: email,     set: setEmail,     ph: 'juan@miempresa.com',    ac: 'email' },
              { label: 'Contraseña',      type: 'password', val: password,  set: setPassword,  ph: 'Mínimo 6 caracteres',   ac: 'new-password' },
              { label: 'Confirmar contraseña', type: 'password', val: password2, set: setPassword2, ph: 'Repite la contraseña', ac: 'new-password' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: 'var(--t2)' }}>{f.label}</label>
                <input
                  type={f.type} required autoComplete={f.ac}
                  value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ background: 'var(--surface2)', color: 'var(--t1)', border: '1px solid var(--border2)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>
            ))}

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: 'rgba(239,68,68,.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all mt-2"
              style={{
                background: busy ? 'var(--t3)' : 'var(--brand)',
                boxShadow: busy ? 'none' : '0 2px 12px rgba(14,165,233,.35)',
              }}>
              {busy ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: 'var(--t2)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-bold" style={{ color: 'var(--brand)' }}>
              Inicia sesión →
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--t3)' }}>
          Al registrarte aceptas nuestros{' '}
          <a href="#" style={{ color: 'var(--brand)' }}>Términos de servicio</a>
          {' '}y{' '}
          <a href="#" style={{ color: 'var(--brand)' }}>Política de privacidad</a>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/invalid-email':        'El formato del correo no es válido.',
    'auth/weak-password':        'La contraseña es muy débil.',
    'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google.',
  };
  return map[code] ?? 'Ocurrió un error. Intenta de nuevo.';
}