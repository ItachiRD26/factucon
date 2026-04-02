'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

export default function CuentaPage() {
  const { user, portalUser, logout } = useAuth();
  const router = useRouter();

  const [editing,    setEditing]    = useState(false);
  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function openEdit() {
    setName(portalUser?.displayName  ?? user?.displayName ?? '');
    setPhone(portalUser?.phone ?? '');
    setEditing(true);
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      // Actualizar Firebase Auth
      await updateProfile(user, { displayName: name.trim() });

      // Actualizar Firestore
      await updateDoc(doc(db, 'portal_users', user.uid), {
        displayName: name.trim(),
        phone:       phone.trim(),
        updatedAt:   serverTimestamp(),
      });

      setEditing(false);
      setSaved(true);
      // Forzar reload para que el AuthContext tome el nombre nuevo
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push('/auth/login');
  }

  if (!user) return null;

  const displayName = portalUser?.displayName ?? user.displayName ?? null;
  const photoURL    = user.photoURL;
  const isGoogle    = user.providerData?.[0]?.providerId === 'google.com';
  const createdAt   = portalUser?.createdAt
    ? new Date(portalUser.createdAt).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const initials = displayName
    ? displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : (user.email?.[0] ?? 'U').toUpperCase();

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 4, letterSpacing: '-0.03em' }}>
          Mi cuenta
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.35)' }}>
          Gestiona tu información personal
        </p>
      </div>

      {/* Saved banner */}
      {saved && (
        <div style={{ padding: '10px 16px', background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 10, fontSize: '0.82rem', color: '#34D399', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✅ Nombre actualizado correctamente
        </div>
      )}

      {/* Avatar + nombre */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          {/* Avatar */}
          {photoURL ? (
            <img src={photoURL} alt={displayName ?? ''} referrerPolicy="no-referrer"
              style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,.1)' }}
            />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 18, flexShrink: 0, background: 'linear-gradient(135deg,#0EA5E9,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 3 }}>
              {displayName ?? <span style={{ color: 'rgba(255,255,255,.3)', fontStyle: 'italic' }}>Sin nombre</span>}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)' }}>{user.email}</div>
            {isGoogle && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(66,133,244,.1)', color: '#93C5FD' }}>
                <svg width="10" height="10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Cuenta Google
              </div>
            )}
          </div>
        </div>

        {/* Info fields */}
        {!editing ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              {[
                ['Nombre completo', displayName ?? '—'],
                ['Correo',          user.email  ?? '—'],
                ['Teléfono',        portalUser?.phone || '—'],
                ['Miembro desde',   createdAt ?? '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '0.85rem', color: '#F8FAFC', fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
            <button onClick={openEdit}
              style={{ padding: '9px 20px', borderRadius: 10, background: 'rgba(14,165,233,.1)', border: '1px solid rgba(14,165,233,.25)', color: '#38BDF8', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✏️ Editar nombre y teléfono
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nombre completo *
              </label>
              <input value={name} onChange={e => setName(e.target.value)} required
                placeholder="Tu nombre completo"
                style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.12)')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Teléfono
              </label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="809-000-0000"
                style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.12)')}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setEditing(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving || !name.trim()}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: saving ? 'rgba(14,165,233,.4)' : '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: saving || !name.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !name.trim() ? 0.5 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Zona de peligro */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '18px 20px' }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 14 }}>Sesión</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!isGoogle && (
            <button style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(14,165,233,.08)', border: '1px solid rgba(14,165,233,.2)', color: '#38BDF8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cambiar contraseña
            </button>
          )}
          <button onClick={handleLogout} disabled={loggingOut}
            style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#F87171', fontSize: '0.8rem', fontWeight: 600, cursor: loggingOut ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loggingOut ? 0.6 : 1 }}>
            {loggingOut ? 'Cerrando...' : '🚪 Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}