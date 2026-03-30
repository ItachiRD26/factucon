'use client';
import { WizardData } from './wizard-shell';
import { ModuleId } from '@/lib/types';

interface Props {
  data: WizardData;
  onUpdate: (p: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ALL_MODULES: { id: ModuleId; label: string; desc: string; icon: string; price: number; required?: boolean }[] = [
  { id: 'pos',                 label: 'Punto de venta (POS)',      icon: '🛒', desc: 'Registra ventas rápidamente',        price: 0,   required: true },
  { id: 'inventory',           label: 'Control de inventario',     icon: '📦', desc: 'Stock, alertas y movimientos',       price: 0,   required: true },
  { id: 'quotes',              label: 'Cotizaciones',              icon: '📋', desc: 'Genera presupuestos profesionales',  price: 0   },
  { id: 'reports',             label: 'Reportes y análisis',       icon: '📈', desc: 'Ventas, ITBIS, top productos',       price: 0,   required: true },
  { id: 'ecf',                 label: 'Facturación e-CF DGII',     icon: '🧾', desc: 'NCF y e-CF electrónico oficial',    price: 300 },
  { id: 'clients',             label: 'CRM de clientes',           icon: '👥', desc: 'Historial, RNC, crédito',           price: 150 },
  { id: 'purchases',           label: 'Módulo de compras',         icon: '🏪', desc: 'Proveedores, órdenes de compra',    price: 200 },
  { id: 'accounts_receivable', label: 'Cuentas por cobrar',        icon: '💳', desc: 'Deudas, recordatorios automáticos', price: 200 },
  { id: 'multi_warehouse',     label: 'Multi-almacén',             icon: '🏭', desc: 'Gestiona múltiples sucursales',     price: 300 },
];

export function Step2Modules({ data, onUpdate, onNext, onBack }: Props) {
  function toggle(id: ModuleId) {
    const m = data.modules;
    if (m.includes(id)) {
      onUpdate({ modules: m.filter(x => x !== id) });
    } else {
      onUpdate({ modules: [...m, id] });
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
        Elige tus módulos
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 22 }}>
        Los módulos marcados con precio son adicionales al costo base. Los módulos requeridos no se pueden desactivar.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {ALL_MODULES.map(m => {
          const active = data.modules.includes(m.id);
          return (
            <div key={m.id} onClick={() => !m.required && toggle(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                borderRadius: 12, cursor: m.required ? 'default' : 'pointer',
                background: active ? 'rgba(14,165,233,.08)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${active ? 'rgba(14,165,233,.3)' : 'rgba(255,255,255,.08)'}`,
                transition: 'all .13s',
              }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>{m.label}</span>
                  {m.required && <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,.12)', color: '#34D399' }}>INCLUIDO</span>}
                  {m.price > 0 && <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#0EA5E9' }}>+RD${m.price}/mes</span>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.35)', marginTop: 1 }}>{m.desc}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: active ? '#0EA5E9' : 'rgba(255,255,255,.08)',
                border: `1px solid ${active ? '#0EA5E9' : 'rgba(255,255,255,.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#fff', transition: 'all .13s',
              }}>
                {active ? '✓' : ''}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ padding: '10px 22px', borderRadius: 11, background: 'rgba(255,255,255,.07)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.88rem', border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer' }}>
          ← Atrás
        </button>
        <button onClick={onNext} style={{ padding: '10px 28px', borderRadius: 11, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(14,165,233,.3)' }}>
          Continuar →
        </button>
      </div>
    </div>
  );
}