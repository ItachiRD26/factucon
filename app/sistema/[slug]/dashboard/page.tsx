'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface SistemaSession {
  companyId:    string;
  slug:         string;
  role:         string;
  label:        string;
  modules:      string[];
  companyName:  string;
  primaryColor: string;
}

const MODULE_ICONS: Record<string, { icon: string; label: string; href: string }> = {
  pos:                 { icon: '🛒', label: 'Punto de Venta',     href: 'pos' },
  inventory:           { icon: '📦', label: 'Inventario',          href: 'inventario' },
  quotes:              { icon: '📋', label: 'Cotizaciones',         href: 'cotizaciones' },
  reports:             { icon: '📈', label: 'Reportes',             href: 'reportes' },
  ecf:                 { icon: '🧾', label: 'Facturas e-CF',        href: 'facturas' },
  clients:             { icon: '👥', label: 'Clientes',             href: 'clientes' },
  purchases:           { icon: '🏪', label: 'Compras',              href: 'compras' },
  accounts_receivable: { icon: '💳', label: 'Cuentas × Cobrar',    href: 'cuentas' },
  multi_warehouse:     { icon: '🏭', label: 'Almacenes',            href: 'almacenes' },
};

const ROLE_LABELS: Record<string, string> = {
  owner:   '👑 Propietario',
  admin:   '⭐ Administrador',
  cashier: '💰 Cajero',
};

export default function SistemaDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const [session, setSession] = useState<SistemaSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Leer token de cookie
    const token = getCookie('sistema-session');
    if (!token) {
      router.replace(`/sistema/${slug}`);
      return;
    }

    try {
      const decoded = jwtDecode<SistemaSession & { exp: number }>(token);

      // Verificar que el token no expiró
      if (decoded.exp * 1000 < Date.now()) {
        deleteCookie('sistema-session');
        router.replace(`/sistema/${slug}`);
        return;
      }

      // Verificar que el token es para este slug
      if (decoded.slug !== slug) {
        router.replace(`/sistema/${slug}`);
        return;
      }

      setSession(decoded);
    } catch {
      router.replace(`/sistema/${slug}`);
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  function handleLogout() {
    deleteCookie('sistema-session');
    router.replace(`/sistema/${slug}`);
  }

  if (loading) return <Loader color="#0EA5E9" />;
  if (!session) return null;

  const color    = session.primaryColor ?? '#0EA5E9';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <div style={{ minHeight: '100vh', background: '#080D1A', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#F8FAFC' }}>

      {/* Topbar */}
      <header style={{
        height: 56, background: 'rgba(10,16,32,.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: `0 2px 8px ${color}40` }}>
            🏢
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1 }}>{session.companyName}</div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{session.label} · {ROLE_LABELS[session.role] ?? session.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'rgba(255,255,255,.25)', display: 'none' }}>
            {new Date().toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <button onClick={handleLogout}
            style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#F87171', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Salir
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
            {greeting}, {session.label} 👋
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,.35)' }}>
            {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Módulos disponibles */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Accesos rápidos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {session.modules.map(moduleId => {
              const mod = MODULE_ICONS[moduleId];
              if (!mod) return null;
              return (
                <button key={moduleId}
                  onClick={() => router.push(`/sistema/${slug}/${mod.href}`)}
                  style={{
                    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                    borderRadius: 16, padding: '20px 16px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all .15s', fontFamily: 'inherit',
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLElement).style.background = `${color}12`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.08)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 10 }}>{mod.icon}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F8FAFC' }}>{mod.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info de sesión */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)', marginBottom: 2 }}>ROL</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ROLE_LABELS[session.role] ?? session.role}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)', marginBottom: 2 }}>MÓDULOS</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{session.modules.length} disponibles</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)', marginBottom: 2 }}>SISTEMA</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color }}>
                {slug}.facturacon.cfd
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.2)' }}>
            Powered by Factucon
          </div>
        </div>
      </main>
    </div>
  );
}

// Helpers para cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function Loader({ color }: { color: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080D1A' }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}