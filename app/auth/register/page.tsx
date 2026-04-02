'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

export default function RegisterPage() {
  const { register, loginGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [password2,   setPassword2]   = useState('');
  const [error,       setError]       = useState('');
  const [busy,        setBusy]        = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Cuando user esté listo y loading=false → redirigir
  useEffect(() => {
    if (!loading && user && redirecting) {
      router.replace('/portal/dashboard');
    }
  }, [user, loading, redirecting, router]);

  // Si ya hay sesión activa (recargó la página) → ir directo
  useEffect(() => {
    if (!loading && user && !redirecting) {
      router.replace('/portal/dashboard');
    }
  }, [loading]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6)    { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setBusy(true);
    try {
      await register(email, password, name);
      setRedirecting(true); // onAuthStateChanged se encarga del redirect
    } catch (err: any) {
      setError(friendlyError(err.code));
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setBusy(true);
    try {
      await loginGoogle();
      // loginGoogle() ya setea la cookie antes de resolver
      // Activar el loading screen y dejar que useEffect haga el redirect
      setRedirecting(true);
    } catch (err: any) {
      setError(friendlyError(err.code));
      setBusy(false);
    }
  }

  // Loading inicial de Firebase
  if (loading) return <LoadingScreen message="Verificando sesión..." />;

  // Loading screen después de autenticarse — espera que la cookie esté lista
  if (redirecting) return <LoadingScreen message="Preparando tu cuenta..." />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#060D1F' }}>
      <div className="w-full max-w-md" style={{ animation: 'fadeIn .3s ease' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#0EA5E9', boxShadow: '0 4px 14px rgba(14,165,233,.4)' }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            Factu<span style={{ color: '#0EA5E9' }}>con</span>
          </span>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 20, padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,.3)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 4, letterSpacing: '-0.03em' }}>
            Crea tu cuenta
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.4)', marginBottom: 24, lineHeight: 1.6 }}>
            Registra tu cuenta personal — luego puedes crear múltiples empresas.
          </p>

          {/* Google */}
          <button onClick={handleGoogle} disabled={busy}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.88rem', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 20, opacity: busy ? 0.6 : 1, transition: 'all .15s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {busy ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}/>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.3)' }}>o con tu correo</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}/>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Nombre completo',      type: 'text',     val: name,      set: setName,      ph: 'Juan Rodríguez',      ac: 'name' },
              { label: 'Correo electrónico',   type: 'email',    val: email,     set: setEmail,     ph: 'juan@miempresa.com',  ac: 'email' },
              { label: 'Contraseña',           type: 'password', val: password,  set: setPassword,  ph: 'Mínimo 6 caracteres', ac: 'new-password' },
              { label: 'Confirmar contraseña', type: 'password', val: password2, set: setPassword2, ph: 'Repite la contraseña', ac: 'new-password' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {f.label}
                </label>
                <input
                  type={f.type} required autoComplete={f.ac}
                  value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph}
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 11, padding: '11px 14px', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color .13s' }}
                  onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
                />
              </div>
            ))}

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, fontSize: '0.8rem', color: '#F87171' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy}
              style={{ padding: '12px', borderRadius: 12, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', background: busy ? 'rgba(14,165,233,.4)' : '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit', boxShadow: busy ? 'none' : '0 2px 14px rgba(14,165,233,.35)', transition: 'all .15s', marginTop: 4 }}>
              {busy ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,.4)', marginTop: 20 }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" style={{ color: '#0EA5E9', fontWeight: 700, textDecoration: 'none' }}>
              Inicia sesión →
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,.2)', marginTop: 16 }}>
          Al registrarte aceptas nuestros{' '}
          <a href="#" style={{ color: 'rgba(255,255,255,.4)' }}>Términos de servicio</a>
          {' '}y{' '}
          <a href="#" style={{ color: 'rgba(255,255,255,.4)' }}>Política de privacidad</a>
        </p>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#060D1F', gap: 20 }}>
      {/* Logo animado */}
      <div style={{ width: 52, height: 52, borderRadius: 16, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(14,165,233,.4)', animation: 'pulse 1.5s ease-in-out infinite' }}>
        <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>

      {/* Spinner */}
      <div style={{ width: 24, height: 24, border: '2.5px solid rgba(14,165,233,.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>

      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,.5)', fontFamily: 'inherit' }}>{message}</p>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
      `}</style>
    </div>
  );
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use':   'Ya existe una cuenta con ese correo.',
    'auth/invalid-email':          'El formato del correo no es válido.',
    'auth/weak-password':          'La contraseña es muy débil.',
    'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
    'auth/popup-closed-by-user':   'Cerraste la ventana de Google.',
    'auth/cancelled-popup-request':'Operación cancelada.',
  };
  return map[code] ?? 'Ocurrió un error. Intenta de nuevo.';
}