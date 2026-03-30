'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const TITLES: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'Mis empresas',  sub: 'Gestiona todos tus sistemas de facturación' },
  '/wizard':    { title: 'Crear sistema', sub: 'Configura tu nuevo sistema paso a paso' },
  '/soporte':   { title: 'Soporte',       sub: 'Estamos aquí para ayudarte' },
  '/cuenta':    { title: 'Mi cuenta',     sub: 'Administra tu perfil personal' },
};

export function Topbar() {
  const pathname = usePathname();
  const info = TITLES[pathname] ?? { title: 'Factucon', sub: '' };

  return (
    <header style={{
      height: 58, background: 'rgba(10,16,32,.95)',
      borderBottom: '1px solid rgba(255,255,255,.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', position: 'sticky', top: 0, zIndex: 40,
      backdropFilter: 'blur(12px)',
    }}>
      <div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1 }}>
          {info.title}
        </div>
        {info.sub && (
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.3)', marginTop: 3 }}>
            {info.sub}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Botón crear empresa */}
        <Link href="/portal/dashboard/wizard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '0.8rem', fontWeight: 700, color: '#fff',
          padding: '7px 16px', borderRadius: 10,
          background: '#0EA5E9', textDecoration: 'none',
          boxShadow: '0 2px 10px rgba(14,165,233,.3)',
          transition: 'all .13s',
        }}>
          + Nueva empresa
        </Link>
      </div>
    </header>
  );
}