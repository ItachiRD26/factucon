'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent,  setSent]  = useState(false);
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.code === 'auth/user-not-found'
        ? 'No existe una cuenta con ese correo.'
        : 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#060D1F' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 36 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
            Factu<span style={{ color: '#0EA5E9' }}>con</span>
          </span>
        </Link>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 20, padding: 32 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📧</div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>Revisa tu correo</h2>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.7, marginBottom: 24 }}>
                Enviamos un enlace para restablecer tu contraseña a <strong style={{ color: '#F8FAFC' }}>{email}</strong>
              </p>
              <Link href="/auth/login" style={{ color: '#0EA5E9', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                ← Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 6 }}>
                Recuperar contraseña
              </h1>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 24, lineHeight: 1.7 }}>
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Correo electrónico
                  </label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="juan@miempresa.com"
                    style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                {error && (
                  <div style={{ padding: '9px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 9, fontSize: '0.78rem', color: '#F87171' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={busy}
                  style={{ padding: '11px', borderRadius: 11, background: busy ? 'rgba(14,165,233,.4)' : '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: busy ? 'not-allowed' : 'pointer' }}>
                  {busy ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>
                <Link href="/auth/login" style={{ color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>
                  ← Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}