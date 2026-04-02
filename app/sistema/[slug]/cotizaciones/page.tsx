'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';

interface Quote {
  id: string; number: string; clientName: string; clientRnc?: string;
  items: any[]; subtotal: number; tax: number; total: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';
  notes: string; validUntil: string; createdAt: any; createdBy: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Borrador',   color: '#94A3B8', bg: 'rgba(148,163,184,.1)' },
  sent:      { label: 'Enviada',    color: '#38BDF8', bg: 'rgba(14,165,233,.1)'  },
  approved:  { label: 'Aprobada',   color: '#34D399', bg: 'rgba(16,185,129,.1)'  },
  rejected:  { label: 'Rechazada',  color: '#F87171', bg: 'rgba(239,68,68,.1)'   },
  converted: { label: 'Convertida', color: '#A78BFA', bg: 'rgba(139,92,246,.1)'  },
};

export default function CotizacionesPage() {
  const { session, loading, slug } = useSistemaSession();
  const router  = useRouter();
  const [quotes, setQuotes]   = useState<Quote[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch]   = useState('');

  const color = session?.primaryColor ?? '#0EA5E9';

  function load() {
    if (!session?.companyId) return;
    fetch(`/api/sistema/quotes?companyId=${session.companyId}`)
      .then(r => r.json())
      .then(d => setQuotes(d.quotes ?? []))
      .finally(() => setLoadingData(false));
  }

  useEffect(() => { if (session) load(); }, [session]);

  async function updateStatus(id: string, status: string) {
    await fetch('/api/sistema/quotes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, companyId: session!.companyId }),
    });
    load();
  }

  async function convertToSale(quote: Quote) {
    router.push(`/sistema/${slug}/pos?quoteId=${quote.id}`);
  }

  const filtered = quotes.filter(q =>
    q.number.includes(search) ||
    q.clientName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>📋 Cotizaciones</h1>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>{quotes.length} cotizaciones</p>
          </div>
          <button onClick={() => router.push(`/sistema/${slug}/cotizaciones/nueva`)}
            style={{ padding: '9px 18px', borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}>
            + Nueva cotización
          </button>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por número o cliente..."
          style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', marginBottom: 16 }}
        />

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 16 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.85rem' }}>No hay cotizaciones todavía</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(q => {
              const st = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.draft;
              return (
                <div key={q.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: color }}>{q.number}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: 2 }}>{q.clientName}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.3)' }}>
                      Válida hasta: {q.validUntil} · {q.items.length} ítem{q.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>
                      RD${q.total.toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {q.status === 'draft' && (
                        <button onClick={() => updateStatus(q.id, 'sent')}
                          style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(14,165,233,.1)', border: '1px solid rgba(14,165,233,.2)', color: '#38BDF8', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Enviar
                        </button>
                      )}
                      {(q.status === 'sent' || q.status === 'approved') && (
                        <button onClick={() => convertToSale(q)}
                          style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', color: '#34D399', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                          → POS
                        </button>
                      )}
                      {q.status === 'sent' && (
                        <button onClick={() => updateStatus(q.id, 'rejected')}
                          style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#F87171', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SistemaLayout>
  );
}