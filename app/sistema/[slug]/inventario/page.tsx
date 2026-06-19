'use client';
import { useState, useEffect } from 'react';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';
import { TEMPLATES } from '@/lib/types';

interface Product {
  id: string; code: string; name: string;
  price: number; cost: number; stock: number;
  category: string; taxable: boolean; isActive: boolean;
}
interface Movement {
  id: string; productName: string; type: string;
  quantity: number; createdAt: any; createdBy: string; referenceType: string;
}

export default function InventarioPage() {
  const { session, loading } = useSistemaSession();
  const template = TEMPLATES.find(t => t.id === session?.templateId) ?? TEMPLATES.find(t => t.id === 'custom')!;
  const [products,   setProducts]   = useState<Product[]>([]);
  const [movements,  setMovements]  = useState<Movement[]>([]);
  const [tab,        setTab]        = useState<'stock' | 'movements' | 'adjust'>('stock');
  const [search,     setSearch]     = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [showAdjust, setShowAdjust]  = useState<Product | null>(null);
  const [adjQty,    setAdjQty]      = useState('');
  const [adjReason, setAdjReason]   = useState('');
  const [adjType,   setAdjType]     = useState<'add' | 'subtract' | 'set'>('add');
  const [saving,    setSaving]      = useState(false);

  const color     = session?.primaryColor ?? '#0EA5E9';
  const isOwner   = session?.role === 'owner' || session?.role === 'admin';

  function load() {
    if (!session?.companyId) return;
    setLoadingData(true);
    Promise.all([
      fetch(`/api/sistema/products?companyId=${session.companyId}`).then(r => r.json()),
      fetch(`/api/sistema/inventory/movements?companyId=${session.companyId}`).then(r => r.json()),
    ])
    .then(([p, m]) => { setProducts(p.products ?? []); setMovements(m.movements ?? []); })
    .finally(() => setLoadingData(false));
  }

  useEffect(() => { if (session) load(); }, [session]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock  = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outStock  = products.filter(p => p.stock <= 0).length;
  const totalValue = products.reduce((s, p) => s + p.cost * p.stock, 0);

  async function handleAdjust() {
    if (!showAdjust || !adjQty) return;
    setSaving(true);
    await fetch('/api/sistema/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: session!.companyId,
        productId: showAdjust.id,
        type:      adjType,
        quantity:  parseInt(adjQty),
        reason:    adjReason,
        createdBy: session!.label,
      }),
    });
    setShowAdjust(null); setAdjQty(''); setAdjReason('');
    setSaving(false); load();
  }

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 6 }}>📦 Inventario</h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)', marginBottom: 20 }}>Control de stock en tiempo real</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            [`Total ${template.productLabel.plural.toLowerCase()}`, products.length, '#0EA5E9', '📦'],
            ['Stock bajo (≤10)', lowStock, '#F59E0B', '⚠️'],
            ['Sin stock', outStock, '#EF4444', '🚫'],
            ['Valor inventario', `RD$${totalValue.toLocaleString()}`, '#10B981', '💰'],
          ].map(([label, val, color2, icon]) => (
            <div key={label as string} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: color2 as string, marginBottom: 2 }}>{val}</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.35)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['stock', 'movements'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '7px 16px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: tab === t ? color : 'rgba(255,255,255,.07)', color: tab === t ? '#fff' : 'rgba(255,255,255,.5)' }}>
              {t === 'stock' ? '📦 Stock' : '📋 Movimientos'}
            </button>
          ))}
        </div>

        {tab === 'stock' && (
          <>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Buscar ${template.productLabel.singular.toLowerCase()}...`}
                style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            {loadingData ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 100px 80px 80px', padding: '10px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  {['Código','Nombre','Stock','Precio','Costo','Acción'].map(h => (
                    <div key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                  ))}
                </div>
                {filtered.map((p, i) => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 100px 80px 80px', padding: '11px 16px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color }}>{p.code}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F8FAFC' }}>{p.name}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: p.stock <= 0 ? '#EF4444' : p.stock <= 10 ? '#F59E0B' : '#34D399' }}>{p.stock}</div>
                    <div style={{ fontSize: '0.78rem', color: '#F8FAFC' }}>RD${p.price.toLocaleString()}</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)' }}>RD${p.cost.toLocaleString()}</div>
                    {isOwner && (
                      <button onClick={() => { setShowAdjust(p); setAdjQty(''); setAdjReason(''); setAdjType('add'); }}
                        style={{ padding: '4px 10px', borderRadius: 7, background: `${color}15`, border: `1px solid ${color}40`, color, fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Ajustar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'movements' && (
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', padding: '10px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              {[template.productLabel.singular,'Tipo','Cantidad','Por'].map(h => (
                <div key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {movements.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '0.82rem' }}>Sin movimientos registrados</div>
            ) : movements.slice(0, 50).map((m, i) => (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', padding: '10px 16px', borderBottom: i < movements.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#F8FAFC' }}>{m.productName}</div>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: m.type === 'sale' ? 'rgba(239,68,68,.1)' : m.type === 'purchase' ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: m.type === 'sale' ? '#F87171' : m.type === 'purchase' ? '#34D399' : '#FCD34D' }}>
                    {m.type === 'sale' ? 'Venta' : m.type === 'purchase' ? 'Compra' : 'Ajuste'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: m.quantity < 0 ? '#F87171' : '#34D399' }}>
                  {m.quantity > 0 ? '+' : ''}{m.quantity}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)' }}>{m.createdBy}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal ajuste */}
      {showAdjust && (
        <div onClick={() => setShowAdjust(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 380 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Ajustar stock</h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 20 }}>
              {showAdjust.name} — Stock actual: <strong style={{ color: '#F8FAFC' }}>{showAdjust.stock}</strong>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 14 }}>
              {([['add','Agregar','#10B981'],['subtract','Restar','#EF4444'],['set','Establecer','#0EA5E9']] as const).map(([v,l,c]) => (
                <button key={v} onClick={() => setAdjType(v)}
                  type="button"
                  style={{ padding: '8px', borderRadius: 9, border: `1px solid ${adjType === v ? c : 'rgba(255,255,255,.1)'}`, background: adjType === v ? c + '18' : 'rgba(255,255,255,.04)', color: adjType === v ? c : 'rgba(255,255,255,.5)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 5, textTransform: 'uppercase' }}>Cantidad</label>
              <input type="number" min="0" value={adjQty} onChange={e => setAdjQty(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 12px', color: '#F8FAFC', fontSize: '0.95rem', outline: 'none', fontFamily: 'monospace', textAlign: 'center' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 5, textTransform: 'uppercase' }}>Motivo (opcional)</label>
              <input value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Ej: Conteo físico, merma..."
                style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdjust(null)}
                style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={handleAdjust} disabled={saving || !adjQty}
                style={{ flex: 1, padding: '9px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: saving || !adjQty ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !adjQty ? 0.5 : 1 }}>
                {saving ? 'Guardando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SistemaLayout>
  );
}