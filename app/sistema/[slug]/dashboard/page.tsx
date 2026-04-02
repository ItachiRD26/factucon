'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { SistemaLayout } from '@/app/sistema/layout-component';
import { getCookie, deleteCookie, SistemaSession } from '@/app/sistema/hooks/use-sistema-session';

// Módulos permitidos por rol
const ROLE_MODULES: Record<string, string[]> = {
  owner:   ['pos','inventory','quotes','clients','reports','ecf','purchases','accounts_receivable','multi_warehouse'],
  admin:   ['pos','inventory','quotes','clients','reports','ecf','purchases','accounts_receivable','multi_warehouse'],
  cashier: ['pos','quotes'],
};

const MODULE_CONFIG: Record<string, { icon: string; label: string; href: string; desc: string }> = {
  pos:                 { icon: '🛒', label: 'Punto de Venta',     href: 'pos',          desc: 'Registrar ventas' },
  inventory:           { icon: '📦', label: 'Inventario',          href: 'inventario',   desc: 'Control de stock' },
  quotes:              { icon: '📋', label: 'Cotizaciones',         href: 'cotizaciones', desc: 'Crear presupuestos' },
  clients:             { icon: '👥', label: 'Clientes',             href: 'clientes',     desc: 'CRM básico' },
  reports:             { icon: '📈', label: 'Reportes',             href: 'reportes',     desc: 'Análisis de ventas' },
  ecf:                 { icon: '🧾', label: 'Facturas e-CF',        href: 'facturas',     desc: 'Comprobantes fiscales' },
  purchases:           { icon: '🏪', label: 'Compras',              href: 'compras',      desc: 'Proveedores' },
  accounts_receivable: { icon: '💳', label: 'Cuentas × Cobrar',    href: 'cuentas',      desc: 'Deudas de clientes' },
  multi_warehouse:     { icon: '🏭', label: 'Almacenes',            href: 'almacenes',    desc: 'Multi-sucursal' },
};

const ROLE_LABELS: Record<string, string> = {
  owner:   '👑 Propietario',
  admin:   '⭐ Administrador',
  cashier: '💰 Cajero',
};

export default function SistemaDashboardPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();
  const [session, setSession] = useState<SistemaSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie('sistema-session');
    if (!token) { router.replace(`/sistema/${slug}`); return; }
    try {
      const decoded = jwtDecode<SistemaSession & { exp: number }>(token);
      if (decoded.exp * 1000 < Date.now()) {
        deleteCookie('sistema-session');
        router.replace(`/sistema/${slug}`);
        return;
      }
      if (decoded.slug !== slug) { router.replace(`/sistema/${slug}`); return; }
      setSession(decoded);
    } catch {
      router.replace(`/sistema/${slug}`);
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  if (loading || !session) return null;

  const color   = session.primaryColor ?? '#0EA5E9';
  const role    = session.role;

  // Módulos que: 1) el rol permite 2) están activos en la empresa
  const allowedByRole    = ROLE_MODULES[role] ?? ROLE_MODULES.cashier;
  const visibleModules   = allowedByRole.filter(m => session.modules.includes(m));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 4 }}>
            {greeting}, {session.label} 👋
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,.35)' }}>
            {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Accesos rápidos */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            Accesos rápidos
          </h2>

          {visibleModules.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)', borderRadius: 14 }}>
              <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '0.82rem' }}>
                No tienes módulos asignados. Contacta al administrador.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {visibleModules.map(moduleId => {
                const mod = MODULE_CONFIG[moduleId];
                if (!mod) return null;
                return (
                  <button key={moduleId}
                    onClick={() => router.push(`/sistema/${slug}/${mod.href}`)}
                    style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '20px 16px', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', transition: 'all .15s' }}
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
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 3 }}>{mod.label}</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)' }}>{mod.desc}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Info sesión */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['ROL',      ROLE_LABELS[role] ?? role],
              ['MÓDULOS',  `${visibleModules.length} disponibles`],
              ['SISTEMA',  `${slug}.facturacon.cfd`],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F8FAFC', fontFamily: label === 'SISTEMA' ? 'monospace' : 'inherit' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.2)' }}>Powered by Factucon</div>
        </div>
      </div>
    </SistemaLayout>
  );
}