'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useState } from 'react';

const NAV = [
  { label: 'Mis empresas',  href: '/portal/dashboard',         icon: '🏢' },
  { label: 'Soporte',       href: '/portal/dashboard/soporte',            icon: '🎧' },
  { label: 'Mi cuenta',     href: '/portal/dashboard/cuenta',             icon: '👤' },
];

export function Sidebar() {
  const pathname  = usePathname();
  const { portalUser, logout } = useAuth();
  const router    = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push('/auth/login');
  }

  const initials = portalUser?.displayName
?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? 'U';
  return (
    <aside style={{
      width: 232, flexShrink: 0, background: '#060D1F',
      display: 'flex', flexDirection: 'column', height: '100vh',
      borderRight: '1px solid rgba(255,255,255,.07)',
      position: 'sticky', top: 0,
    }}>

      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <Link href="/portal/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: '#0EA5E9', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(14,165,233,.4)',
          }}>
            <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Factu<span style={{ color: '#0EA5E9' }}>con</span>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Portal Admin
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,.2)', padding: '10px 8px 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Menú
        </div>

        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 10, textDecoration: 'none',
              fontSize: '0.83rem', fontWeight: active ? 600 : 500,
              color: active ? '#0EA5E9' : 'rgba(255,255,255,.55)',
              background: active ? 'rgba(14,165,233,.1)' : 'transparent',
              transition: 'all .13s',
            }}>
              <span style={{ fontSize: 15, width: 28, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '12px 0' }}/>

        {/* Nueva empresa CTA */}
        <Link href="/portal/dashboard/wizard" style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
          borderRadius: 10, textDecoration: 'none',
          fontSize: '0.83rem', fontWeight: 700, color: '#fff',
          background: 'rgba(14,165,233,.15)', border: '1px solid rgba(14,165,233,.25)',
          transition: 'all .13s',
        }}>
          <span style={{ fontSize: 15, width: 28, textAlign: 'center' }}>➕</span>
          Nueva empresa
        </Link>
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#0EA5E9,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 800, color: '#fff',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {portalUser?.displayName ?? 'Usuario'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {portalUser?.email}
            </div>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            title="Cerrar sesión"
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .13s', flexShrink: 0,
            }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}