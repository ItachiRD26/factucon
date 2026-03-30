'use client';

import { useAuth } from '@/lib/auth/auth-context';

export default function CuentaPage() {
  const { user, portalUser } = useAuth();

  if (!user) return null;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#F8FAFC',
          marginBottom: 4,
        }}>
          Mi cuenta 👤
        </h1>

        <p style={{
          fontSize: '0.82rem',
          color: 'rgba(255,255,255,.35)',
        }}>
          Gestiona tu información personal y sesión
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 16,
        padding: 24,
      }}>

        {/* Info */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.4)' }}>
              Nombre
            </span>
            <div style={{ fontSize: '0.9rem', color: '#F8FAFC', fontWeight: 600 }}>
              {portalUser?.displayName ?? 'Sin nombre'}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.4)' }}>
              Email
            </span>
            <div style={{ fontSize: '0.9rem', color: '#F8FAFC', fontWeight: 600 }}>
              {user.email}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.4)' }}>
              UID
            </span>
            <div style={{
              fontSize: '0.8rem',
              color: '#0EA5E9',
              fontFamily: 'monospace'
            }}>
              {user.uid}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginTop: 16,
        }}>
          <button style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: 'rgba(14,165,233,.1)',
            border: '1px solid rgba(14,165,233,.25)',
            color: '#38BDF8',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Cambiar contraseña
          </button>

          <button style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: 'rgba(239,68,68,.1)',
            border: '1px solid rgba(239,68,68,.25)',
            color: '#F87171',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}