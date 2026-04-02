'use client';
import { useState, useEffect } from 'react';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';

interface Receivable {
  id:           string;
  clientName:   string;
  clientId:     string;
  saleNumber:   string;
  amount:       number;
  paid:         number;
  balance:      number;
  dueDate:      string;
  status:       'pending' | 'partial' | 'paid' | 'overdue';
  createdAt:    string;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pendiente',  color: '#FCD34D', bg: 'rgba(245,158,11,.1)'  },
  partial:  { label: 'Parcial',    color: '#38BDF8', bg: 'rgba(14,165,233,.1)'  },
  paid:     { label: 'Pagado',     color: '#34D399', bg: 'rgba(16,185,129,.1)'  },
  overdue:  { label: 'Vencido',    color: '#F87171', bg: 'rgba(239,68,68,.1)'   },
};

export default function CuentasPage() {
  const { session, loading } = useSistemaSession();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [selected,    setSelected]    = useState<Receivable | null>(null);
  const [payAmount,   setPayAmount]   = useState('');
  const [paying,      setPaying]      = useState(false);

  const color   = session?.primaryColor ?? '#0EA5E9';
  const isOwner = session?.role === 'owner' || session?.role === 'admin';

  function load() {
    if (!session?.companyId) return;
    fetch(`/api/sistema/receivables?companyId=${session.companyId}`)
      .then(r => r.json())
      .then(d => setReceivables(d.receivables ?? []))
      .finally(() => setLoadingData(false));
  }

  useEffect(() => { if (session) load(); }, [session]);

  async function registerPayment() {
    if (!selected || !payAmount) return;
    const amount = parseFloat(payAmount);
    if (amount <= 0) return;
    setPaying(true);
    await fetch('/api/sistema/receivables', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, amount, companyId: session!.companyId }),
    });
    setSelected(null); setPayAmount(''); setPaying(false); load();
  }

  const filtered = receivables.filter(r => {
    const matchSearch = r.clientName.toLowerCase().includes(search.toLowerCase()) || r.saleNumber.includes(search);
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPending  = receivables.filter(r => r.status !== 'paid').reduce((s, r) => s + r.balance, 0);
  const totalOverdue  = receivables.filter(r => r.status === 'overdue').reduce((s, r) => s + r.balance, 0);
  const countOverdue  = receivables.filter(r => r.status === 'overdue').length;

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>💳 Cuentas por cobrar</h1>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>Control de créditos y pagos pendientes de clientes</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Total por cobrar', `RD$${totalPending.toLocaleString()}`, '#0EA5E9', '💳'],
            ['Vencidas',         countOverdue,                          '#EF4444', '🚨'],
            ['Monto vencido',    `RD$${totalOverdue.toLocaleString()}`, '#F87171', '⚠️'],
          ].map(([label, val, c, icon]) => (
            <div key={label as string} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.6rem' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: c as string }}>{val}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente o factura..."
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 12px', color: '#F8FAFC', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
          />
          {(['all','pending','overdue','paid'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 14px', borderRadius: 9, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: filter === f ? color : 'rgba(255,255,255,.07)', color: filter === f ? '#fff' : 'rgba(255,255,255,.5)' }}>
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'overdue' ? 'Vencidas' : 'Pagadas'}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 16 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💳</div>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.85rem' }}>
              {filter !== 'all' ? 'Sin cuentas en este estado' : 'No hay cuentas por cobrar'}
            </p>
            <p style={{ color: 'rgba(255,255,255,.25)', fontSize: '0.72rem', marginTop: 6 }}>
              Se generan automáticamente cuando se vende a crédito en el POS
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(r => {
              const st      = STATUS_CONFIG[r.status];
              const pct     = r.amount > 0 ? Math.round((r.paid / r.amount) * 100) : 0;
              const isOverd = r.status === 'overdue';
              return (
                <div key={r.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${isOverd ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.08)'}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>{r.clientName}</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: '0.68rem', color: 'rgba(255,255,255,.35)' }}>
                        <span style={{ fontFamily: 'monospace' }}>{r.saleNumber}</span>
                        <span>Vence: {r.dueDate ? new Date(r.dueDate).toLocaleDateString('es-DO') : '—'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: isOverd ? '#F87171' : '#F8FAFC' }}>
                        RD${r.balance.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)' }}>
                        de RD${r.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'rgba(255,255,255,.3)', marginBottom: 4 }}>
                      <span>Pagado: RD${r.paid.toLocaleString()}</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#10B981' : color, borderRadius: 99, transition: 'width .3s' }}/>
                    </div>
                  </div>

                  {/* Acciones */}
                  {isOwner && r.status !== 'paid' && (
                    <button onClick={() => { setSelected(r); setPayAmount(''); }}
                      style={{ padding: '5px 14px', borderRadius: 8, background: `${color}15`, border: `1px solid ${color}40`, color, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      + Registrar pago
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal registrar pago */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, width: '100%', maxWidth: 380, padding: '26px', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Registrar pago</h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 20 }}>
              {selected.clientName} — Saldo: <strong style={{ color: '#F8FAFC' }}>RD${selected.balance.toLocaleString()}</strong>
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 6, textTransform: 'uppercase' }}>Monto recibido (RD$)</label>
              <input type="number" min="1" max={selected.balance} value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder={`Máx. RD$${selected.balance.toLocaleString()}`}
                autoFocus
                style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '11px 14px', color: '#F8FAFC', fontSize: '1rem', outline: 'none', fontFamily: 'monospace', textAlign: 'center' }}
              />
              {payAmount && parseFloat(payAmount) >= selected.balance && (
                <p style={{ fontSize: '0.72rem', color: '#34D399', marginTop: 5, textAlign: 'center' }}>✓ Pagará el saldo completo</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={registerPayment} disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                style={{ flex: 1, padding: '9px', borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: paying || !payAmount ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !payAmount ? 0.5 : 1 }}>
                {paying ? 'Guardando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SistemaLayout>
  );
}