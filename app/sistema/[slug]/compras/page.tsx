'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';

interface Supplier { id: string; name: string; rnc: string; phone: string; email: string; }
interface Purchase {
  id: string; number: string; supplierName: string;
  items: any[]; subtotal: number; tax: number; total: number;
  status: 'pending' | 'received' | 'cancelled';
  createdAt: string; createdBy: string;
}

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  color: '#FCD34D', bg: 'rgba(245,158,11,.1)' },
  received:  { label: 'Recibida',   color: '#34D399', bg: 'rgba(16,185,129,.1)' },
  cancelled: { label: 'Cancelada',  color: '#F87171', bg: 'rgba(239,68,68,.1)'  },
};

export default function ComprasPage() {
  const { slug }             = useParams<{ slug: string }>();
  const router               = useRouter();
  const { session, loading } = useSistemaSession();

  const [purchases,   setPurchases]   = useState<Purchase[]>([]);
  const [suppliers,   setSuppliers]   = useState<Supplier[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search,      setSearch]      = useState('');
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', rnc: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const color    = session?.primaryColor ?? '#0EA5E9';
  const isOwner  = session?.role === 'owner' || session?.role === 'admin';

  function load() {
    if (!session?.companyId) return;
    setLoadingData(true);
    Promise.all([
      fetch(`/api/sistema/purchases?companyId=${session.companyId}`).then(r => r.json()),
      fetch(`/api/sistema/suppliers?companyId=${session.companyId}`).then(r => r.json()),
    ]).then(([p, s]) => { setPurchases(p.purchases ?? []); setSuppliers(s.suppliers ?? []); })
      .finally(() => setLoadingData(false));
  }

  useEffect(() => { if (session) load(); }, [session]);

  async function saveSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierForm.name) return;
    setSaving(true);
    await fetch('/api/sistema/suppliers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...supplierForm, companyId: session!.companyId }),
    });
    setShowNewSupplier(false); setSupplierForm({ name: '', rnc: '', phone: '', email: '' });
    setSaving(false); load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/sistema/purchases', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, companyId: session!.companyId }),
    });
    load();
  }

  const filtered = purchases.filter(p =>
    p.number.includes(search) || p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const totalMonth   = purchases.filter(p => p.status === 'received').reduce((s, p) => s + p.total, 0);
  const pending      = purchases.filter(p => p.status === 'pending').length;

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>🏪 Compras</h1>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>Órdenes de compra y proveedores</p>
          </div>
          {isOwner && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowNewSupplier(true)}
                style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Proveedor
              </button>
              <button onClick={() => router.push(`/sistema/${slug}/compras/nueva`)}
                style={{ padding: '8px 16px', borderRadius: 9, background: color, color: '#fff', fontWeight: 700, fontSize: '0.78rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Nueva orden
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Total compras', purchases.length, '#0EA5E9', '🏪'],
            ['Pendientes',    pending,           '#F59E0B', '⏳'],
            ['Total mes',     `RD$${totalMonth.toLocaleString()}`, '#10B981', '💰'],
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

        {/* Proveedores rápidos */}
        {suppliers.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Proveedores</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {suppliers.map(s => (
                <div key={s.id} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', fontSize: '0.75rem', color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar orden o proveedor..."
          style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', marginBottom: 14 }}
        />

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 16 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏪</div>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.85rem', marginBottom: 16 }}>No hay órdenes de compra</p>
            {isOwner && (
              <button onClick={() => router.push(`/sistema/${slug}/compras/nueva`)}
                style={{ padding: '9px 20px', borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Crear primera orden
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(p => {
              const st = STATUS_CONFIG[p.status];
              return (
                <div key={p.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color }}>{p.number}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: 2 }}>{p.supplierName}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.3)' }}>{p.items?.length ?? 0} ítem{p.items?.length !== 1 ? 's' : ''} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-DO') : '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>RD${p.total.toLocaleString()}</div>
                    {isOwner && p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => updateStatus(p.id, 'received')}
                          style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', color: '#34D399', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                          ✓ Recibida
                        </button>
                        <button onClick={() => updateStatus(p.id, 'cancelled')}
                          style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#F87171', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal nuevo proveedor */}
      {showNewSupplier && (
        <div onClick={() => setShowNewSupplier(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, width: '100%', maxWidth: 440, padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 18 }}>Nuevo proveedor</h3>
            <form onSubmit={saveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Nombre *', 'name', 'text', 'Distribuidora X'],
                ['RNC', 'rnc', 'text', '101-23456-7'],
                ['Teléfono', 'phone', 'tel', '809-000-0000'],
                ['Email', 'email', 'email', 'proveedor@email.com'],
              ].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 5, textTransform: 'uppercase' }}>{label}</label>
                  <input type={type} value={(supplierForm as any)[field]} placeholder={ph}
                    onChange={e => setSupplierForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, padding: '8px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowNewSupplier(false)}
                  style={{ padding: '8px 18px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '8px 20px', borderRadius: 9, background: color, color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Guardando...' : 'Crear proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SistemaLayout>
  );
}