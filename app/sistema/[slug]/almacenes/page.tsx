'use client';
import { useState, useEffect } from 'react';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';

interface Warehouse {
  id: string; name: string; address: string;
  isDefault: boolean; isActive: boolean;
}
interface WProduct {
  productId: string; productName: string; productCode: string;
  stock: number; unit: string;
}

export default function AlmacenesPage() {
  const { session, loading } = useSistemaSession();
  const [warehouses,  setWarehouses]  = useState<Warehouse[]>([]);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [products,    setProducts]    = useState<WProduct[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingProds, setLoadingProds] = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ name: '', address: '' });
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');

  const color   = session?.primaryColor ?? '#0EA5E9';
  const isOwner = session?.role === 'owner' || session?.role === 'admin';

  function load() {
    if (!session?.companyId) return;
    fetch(`/api/sistema/warehouses?companyId=${session.companyId}`)
      .then(r => r.json())
      .then(d => {
        const ws = d.warehouses ?? [];
        setWarehouses(ws);
        if (ws.length > 0 && !selected) setSelected(ws[0].id);
      })
      .finally(() => setLoadingData(false));
  }

  function loadProducts(warehouseId: string) {
    if (!session?.companyId) return;
    setLoadingProds(true);
    fetch(`/api/sistema/warehouses/products?companyId=${session.companyId}&warehouseId=${warehouseId}`)
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []))
      .finally(() => setLoadingProds(false));
  }

  useEffect(() => { if (session) load(); }, [session]);
  useEffect(() => { if (selected) loadProducts(selected); }, [selected]);

  async function createWarehouse(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    await fetch('/api/sistema/warehouses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, companyId: session!.companyId }),
    });
    setShowForm(false); setForm({ name: '', address: '' }); setSaving(false); load();
  }

  const selectedWarehouse = warehouses.find(w => w.id === selected);
  const filteredProducts  = products.filter(p =>
    p.productName.toLowerCase().includes(search.toLowerCase()) || p.productCode.includes(search)
  );

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>🏭 Almacenes</h1>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>Gestión de múltiples sucursales o bodegas</p>
          </div>
          {isOwner && (
            <button onClick={() => setShowForm(true)}
              style={{ padding: '8px 16px', borderRadius: 9, background: color, color: '#fff', fontWeight: 700, fontSize: '0.78rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Nuevo almacén
            </button>
          )}
        </div>

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
        ) : warehouses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 16 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏭</div>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.85rem', marginBottom: 16 }}>No hay almacenes configurados</p>
            {isOwner && (
              <button onClick={() => setShowForm(true)}
                style={{ padding: '9px 20px', borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Crear primer almacén
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
            {/* Lista de almacenes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {warehouses.map(w => (
                <button key={w.id} onClick={() => setSelected(w.id)}
                  style={{ padding: '12px 14px', borderRadius: 12, background: selected === w.id ? `${color}15` : 'rgba(255,255,255,.03)', border: `1px solid ${selected === w.id ? color + '50' : 'rgba(255,255,255,.08)'}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .13s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 16 }}>{w.isDefault ? '⭐' : '🏭'}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: selected === w.id ? '#F8FAFC' : 'rgba(255,255,255,.7)' }}>{w.name}</span>
                  </div>
                  {w.address && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)' }}>{w.address}</div>}
                  {w.isDefault && <div style={{ fontSize: '0.6rem', color, fontWeight: 600, marginTop: 3 }}>Principal</div>}
                </button>
              ))}
            </div>

            {/* Contenido del almacén */}
            <div>
              {selectedWarehouse && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>{selectedWarehouse.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.35)' }}>{products.length} productos · {selectedWarehouse.address || 'Sin dirección'}</div>
                    </div>
                  </div>

                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
                    style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 12px', color: '#F8FAFC', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', marginBottom: 12 }}
                  />

                  {loadingProds ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
                  ) : (
                    <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 80px', padding: '10px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                        {['Código','Producto','Stock','Unidad'].map(h => (
                          <div key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                        ))}
                      </div>
                      {filteredProducts.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '0.82rem' }}>Sin productos en este almacén</div>
                      ) : filteredProducts.map((p, i) => (
                        <div key={p.productId} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 80px', padding: '10px 16px', borderBottom: i < filteredProducts.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', alignItems: 'center' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color }}>{p.productCode}</div>
                          <div style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>{p.productName}</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: p.stock <= 0 ? '#EF4444' : p.stock <= 10 ? '#F59E0B' : '#34D399' }}>
                            {p.stock.toLocaleString('es-DO', { maximumFractionDigits: 3 })}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)' }}>{p.unit}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal nuevo almacén */}
      {showForm && (
        <div onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, width: '100%', maxWidth: 400, padding: '26px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 18 }}>Nuevo almacén</h3>
            <form onSubmit={createWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 5, textTransform: 'uppercase' }}>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sucursal Norte"
                  style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 5, textTransform: 'uppercase' }}>Dirección</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle 5, Santiago"
                  style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '8px 18px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '8px 20px', borderRadius: 9, background: color, color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Guardando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SistemaLayout>
  );
}