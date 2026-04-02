'use client';
import { useState, useEffect } from 'react';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';

interface ReportData {
  todaySales:    number;
  todayTotal:    number;
  monthSales:    number;
  monthTotal:    number;
  monthTax:      number;
  topProducts:   { name: string; qty: number; total: number }[];
  salesByMethod: { method: string; total: number; count: number }[];
  recentSales:   { number: string; client: string; total: number; method: string; date: string }[];
}

export default function ReportesPage() {
  const { session, loading } = useSistemaSession();
  const [data,      setData]      = useState<ReportData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [period,    setPeriod]    = useState<'today' | 'week' | 'month'>('month');
  const [tab,       setTab]       = useState<'summary' | 'sales' | 'products'>('summary');

  const color = session?.primaryColor ?? '#0EA5E9';

  useEffect(() => {
    if (!session?.companyId) return;
    setLoadingData(true);
    fetch(`/api/sistema/reports?companyId=${session.companyId}&period=${period}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoadingData(false));
  }, [session?.companyId, period]);

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>📈 Reportes</h1>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>Análisis de ventas y desempeño</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['today', 'week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '6px 14px', borderRadius: 9, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: period === p ? color : 'rgba(255,255,255,.07)', color: period === p ? '#fff' : 'rgba(255,255,255,.5)' }}>
                {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Sin datos</div>
        ) : (
          <>
            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                ['Ventas hoy',       data.todaySales,                          '#0EA5E9', '🛒'],
                ['Total hoy',        `RD$${data.todayTotal.toLocaleString()}`, '#10B981', '💵'],
                ['Ventas del mes',   data.monthSales,                          '#8B5CF6', '📊'],
                ['ITBIS del mes',    `RD$${data.monthTax.toLocaleString()}`,   '#F59E0B', '🧾'],
              ].map(([label, val, c, icon]) => (
                <div key={label as string} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '16px' }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: c as string, marginBottom: 2, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.35)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['summary', 'sales', 'products'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: '7px 16px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: tab === t ? color : 'rgba(255,255,255,.07)', color: tab === t ? '#fff' : 'rgba(255,255,255,.5)' }}>
                  {t === 'summary' ? '📊 Resumen' : t === 'sales' ? '📋 Ventas' : '🏆 Top Productos'}
                </button>
              ))}
            </div>

            {/* Métodos de pago */}
            {tab === 'summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
                <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px' }}>
                  <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 14 }}>💳 Por método de pago</h3>
                  {data.salesByMethod.map(m => (
                    <div key={m.method} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F8FAFC' }}>{m.method}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)' }}>{m.count} ventas</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color }}>RD${m.total.toLocaleString()}</div>
                    </div>
                  ))}
                  {data.salesByMethod.length === 0 && <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.3)' }}>Sin ventas en este período</p>}
                </div>
                <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px' }}>
                  <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 14 }}>💰 Total del período</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>
                    RD${data.monthTotal.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'rgba(255,255,255,.4)' }}>Subtotal</span>
                      <span style={{ color: '#F8FAFC' }}>RD${(data.monthTotal - data.monthTax).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'rgba(255,255,255,.4)' }}>ITBIS 18%</span>
                      <span style={{ color: '#FCD34D' }}>RD${data.monthTax.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,.07)' }}>
                      <span style={{ color: 'rgba(255,255,255,.4)' }}>Total ventas</span>
                      <span style={{ color: '#F8FAFC', fontWeight: 700 }}>{data.monthSales}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'products' && (
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'grid', gridTemplateColumns: '1fr 80px 120px' }}>
                  {['Producto', 'Cant.', 'Total'].map(h => (
                    <div key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                  ))}
                </div>
                {data.topProducts.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '0.82rem' }}>Sin ventas en este período</div>
                ) : data.topProducts.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', padding: '11px 16px', borderBottom: i < data.topProducts.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>{p.name}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>{p.qty}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color }}>RD${p.total.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'sales' && (
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 80px', padding: '10px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  {['Número','Cliente','Total','Método'].map(h => (
                    <div key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                  ))}
                </div>
                {data.recentSales.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '0.82rem' }}>Sin ventas en este período</div>
                ) : data.recentSales.map((s, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 80px', padding: '10px 16px', borderBottom: i < data.recentSales.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color }}>{s.number}</div>
                    <div style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>{s.client || 'Consumidor Final'}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC' }}>RD${s.total.toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.45)' }}>{s.method}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SistemaLayout>
  );
}