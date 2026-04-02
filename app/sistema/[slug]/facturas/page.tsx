'use client';
import { useState, useEffect } from 'react';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';

interface Sale {
  id:            string;
  saleNumber:    string;
  ncfType:       string;
  clientName?:   string;
  clientRnc?:    string;
  items:         any[];
  subtotal:      number;
  tax:           number;
  total:         number;
  paymentMethod: string;
  cashierName:   string;
  createdAt:     string;
}

const NCF_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  B01: { label: 'B01 — Crédito Fiscal',       color: '#38BDF8', bg: 'rgba(14,165,233,.1)'  },
  B02: { label: 'B02 — Consumidor Final',      color: '#A78BFA', bg: 'rgba(139,92,246,.1)'  },
  B14: { label: 'B14 — Gubernamental',         color: '#34D399', bg: 'rgba(16,185,129,.1)'  },
  B15: { label: 'B15 — Regímenes Especiales',  color: '#FCD34D', bg: 'rgba(245,158,11,.1)'  },
  B16: { label: 'B16 — Exportaciones',         color: '#F87171', bg: 'rgba(239,68,68,.1)'   },
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito',
};

export default function FacturasPage() {
  const { session, loading, slug } = useSistemaSession();
  const [sales,       setSales]       = useState<Sale[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search,      setSearch]      = useState('');
  const [ncfFilter,   setNcfFilter]   = useState('all');
  const [selected,    setSelected]    = useState<Sale | null>(null);

  const color = session?.primaryColor ?? '#0EA5E9';

  function load() {
    if (!session?.companyId) return;
    fetch(`/api/sistema/facturas?companyId=${session.companyId}`)
      .then(r => r.json())
      .then(d => setSales(d.sales ?? []))
      .finally(() => setLoadingData(false));
  }

  useEffect(() => { if (session) load(); }, [session]);

  const filtered = sales.filter(s => {
    const matchSearch = s.saleNumber.includes(search) ||
      (s.clientName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.clientRnc  ?? '').includes(search);
    const matchNcf = ncfFilter === 'all' || s.ncfType === ncfFilter;
    return matchSearch && matchNcf;
  });

  const totalITBIS = filtered.reduce((sum, s) => sum + (s.tax ?? 0), 0);
  const totalVentas = filtered.reduce((sum, s) => sum + (s.total ?? 0), 0);

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>🧾 Facturas</h1>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>
              Historial de comprobantes fiscales
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.open(`/api/sistema/facturas/export?companyId=${session?.companyId}&type=606`, '_blank')}
              style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(14,165,233,.1)', border: '1px solid rgba(14,165,233,.25)', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ⬇ 606
            </button>
            <button
              onClick={() => window.open(`/api/sistema/facturas/export?companyId=${session?.companyId}&type=607`, '_blank')}
              style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.25)', color: '#A78BFA', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ⬇ 607
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Facturas',        filtered.length,                               '#0EA5E9', '🧾'],
            ['Total facturado', `RD$${totalVentas.toLocaleString()}`,          '#10B981', '💵'],
            ['ITBIS generado',  `RD$${totalITBIS.toLocaleString()}`,           '#F59E0B', '📊'],
          ].map(([label, val, c, icon]) => (
            <div key={label as string} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.6rem' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: c as string, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por N° factura, cliente o RNC..."
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 12px', color: '#F8FAFC', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
          />
          <select
            value={ncfFilter}
            onChange={e => setNcfFilter(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 12px', color: '#F8FAFC', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}>
            <option value="all">Todos los NCF</option>
            {Object.entries(NCF_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{k} — {v.label.split('— ')[1]}</option>
            ))}
          </select>
        </div>

        {/* Lista */}
        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 16 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🧾</div>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.85rem' }}>
              {search || ncfFilter !== 'all' ? 'Sin resultados para ese filtro' : 'No hay facturas registradas aún'}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.25)', marginTop: 6 }}>
              Las facturas se generan automáticamente al procesar ventas en el POS
            </p>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 110px 100px 80px', padding: '10px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              {['Número','Cliente','NCF','Total','Método','Fecha'].map(h => (
                <div key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {filtered.map((s, i) => {
              const ncf = NCF_LABELS[s.ncfType] ?? NCF_LABELS.B02;
              return (
                <div key={s.id}
                  onClick={() => setSelected(s)}
                  style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 110px 100px 80px', padding: '11px 16px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background .1s' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
                  onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color }}>{s.saleNumber}</div>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>{s.clientName || 'Consumidor Final'}</div>
                    {s.clientRnc && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)', fontFamily: 'monospace' }}>{s.clientRnc}</div>}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: ncf.bg, color: ncf.color }}>
                      {s.ncfType}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>RD${s.total.toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.45)' }}>
                    {METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.35)' }}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-DO') : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal detalle factura */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>

            {/* Header recibo */}
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', textAlign: 'center', position: 'relative' }}>
              <button onClick={() => setSelected(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🧾</div>
              <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, color, marginBottom: 4 }}>{selected.saleNumber}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)' }}>
                {selected.createdAt ? new Date(selected.createdAt).toLocaleString('es-DO') : '—'}
              </div>
              {(() => {
                const ncf = NCF_LABELS[selected.ncfType] ?? NCF_LABELS.B02;
                return (
                  <div style={{ display: 'inline-flex', marginTop: 8, padding: '3px 12px', borderRadius: 99, background: ncf.bg, fontSize: '0.72rem', fontWeight: 700, color: ncf.color }}>
                    {ncf.label}
                  </div>
                );
              })()}
            </div>

            {/* Cliente */}
            {selected.clientName && (
              <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>{selected.clientName}</div>
                {selected.clientRnc && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)', fontFamily: 'monospace' }}>RNC: {selected.clientRnc}</div>}
              </div>
            )}

            {/* Items */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalle</div>
              {selected.items.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#F8FAFC' }}>{item.productName}</span>
                    <span style={{ color: 'rgba(255,255,255,.4)', marginLeft: 8 }}>×{item.quantity}</span>
                    {item.discount > 0 && <span style={{ color: '#F87171', marginLeft: 6, fontSize: '0.68rem' }}>-{item.discount}%</span>}
                  </div>
                  <span style={{ color: '#F8FAFC', fontWeight: 600 }}>RD${(item.subtotal ?? item.price * item.quantity).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              {[
                ['Subtotal', `RD$${selected.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`],
                ['ITBIS (18%)', `RD$${selected.tax.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,.4)' }}>{l}</span>
                  <span style={{ color: '#F8FAFC' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 4 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC' }}>Total</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>RD${selected.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.3)', marginBottom: 4 }}>
                Método de pago: {METHOD_LABELS[selected.paymentMethod] ?? selected.paymentMethod}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.2)' }}>
                Cajero: {selected.cashierName} · Powered by Factucon
              </div>
            </div>
          </div>
        </div>
      )}
    </SistemaLayout>
  );
}