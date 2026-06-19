'use client';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSistemaSession, deleteCookie } from '@/app/sistema/hooks/use-sistema-session';

interface NavItem {
  href:       string;
  icon:       string;
  label:      string;
  module:     string | null;
  ownerOnly?: boolean;
}

// Todos los nav items posibles con el módulo requerido
const ALL_NAV_ITEMS: NavItem[] = [
  { href: 'dashboard',  icon: '📊', label: 'Dashboard',       module: null         }, // siempre visible
  { href: 'pos',        icon: '🛒', label: 'Punto de Venta',  module: 'pos'         },
  { href: 'inventario', icon: '📦', label: 'Inventario',       module: 'inventory'   },
  { href: 'cotizaciones', icon: '📋', label: 'Cotizaciones',   module: 'quotes'      },
  { href: 'clientes',   icon: '👥', label: 'Clientes',         module: 'clients'     },
  { href: 'reportes',   icon: '📈', label: 'Reportes',         module: 'reports'     },
  { href: 'facturas',   icon: '🧾', label: 'Facturas',         module: 'ecf'         },
  { href: 'certificacion', icon: '🏛️', label: 'Certificación DGII', module: 'ecf'    },
  { href: 'compras',    icon: '🏪', label: 'Compras',          module: 'purchases'   },
  { href: 'cuentas',    icon: '💳', label: 'Cuentas × Cobrar', module: 'accounts_receivable' },
  { href: 'almacenes',  icon: '🏭', label: 'Almacenes',        module: 'multi_warehouse' },
  { href: 'developers', icon: '🔌', label: 'Desarrolladores',  module: null, ownerOnly: true },
];

// Módulos permitidos por rol
const ROLE_ALLOWED: Record<string, (string | null)[]> = {
  owner:   [null, 'pos', 'inventory', 'quotes', 'clients', 'reports', 'ecf', 'purchases', 'accounts_receivable', 'multi_warehouse'],
  admin:   [null, 'pos', 'inventory', 'quotes', 'clients', 'reports', 'ecf', 'purchases', 'accounts_receivable', 'multi_warehouse'],
  cashier: [null, 'pos', 'quotes'], // cajero: solo dashboard, POS y cotizaciones
};

const ROLE_LABELS: Record<string, string> = {
  owner:   '👑 Propietario',
  admin:   '⭐ Administrador',
  cashier: '💰 Cajero',
};

export function SistemaLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSistemaSession();
  const { slug }   = useParams<{ slug: string }>();
  const pathname   = usePathname();
  const router     = useRouter();

  function handleLogout() {
    deleteCookie('sistema-session');
    router.replace(`/sistema/${slug}`);
  }

  if (loading || !session) return null;

  const color   = session.primaryColor ?? '#0EA5E9';
  const allowed = ROLE_ALLOWED[session.role] ?? ROLE_ALLOWED.cashier;

  const navItems = ALL_NAV_ITEMS.filter(item => {
    // 1. Si es exclusivo del owner, solo ese rol lo ve
    if (item.ownerOnly && session.role !== 'owner') return false;
    // 2. El rol lo permite
    if (!allowed.includes(item.module)) return false;
    // 3. Si requiere módulo, la empresa lo tiene activo
    if (item.module !== null && !session.modules.includes(item.module)) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080D1A', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#F8FAFC' }}>

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: '#060D1F', borderRight: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: `0 3px 10px ${color}40`, flexShrink: 0 }}>
              🏢
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{session.companyName}</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,.3)', marginTop: 2 }}>by Factucon</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const href   = `/sistema/${slug}/${item.href}`;
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={item.href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10, textDecoration: 'none',
                marginBottom: 2, fontSize: '0.82rem',
                fontWeight: active ? 600 : 500,
                color: active ? color : 'rgba(255,255,255,.55)',
                background: active ? `${color}15` : 'transparent',
                transition: 'all .13s',
              }}>
                <span style={{ fontSize: 15, width: 26, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color, flexShrink: 0 }}>
              {session.label.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.label}</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.35)' }}>{ROLE_LABELS[session.role] ?? session.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '6px', borderRadius: 8, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', color: '#F87171', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}