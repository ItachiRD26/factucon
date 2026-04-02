'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';
import { getUnit } from '@/lib/units';

interface Product { id: string; code: string; name: string; price: number; stock: number; unit: string; taxable: boolean; }
interface Client  { id: string; name: string; rnc: string; phone: string; email: string; }
interface QuoteItem { productId: string; productName: string; productCode: string; qty: number; price: number; unit: string; discount: number; taxable: boolean; }

const TAX_RATE = 0.18;

export default function NuevaCotizacionPage() {
  const { slug }             = useParams<{ slug: string }>();
  const router               = useRouter();
  const { session, loading } = useSistemaSession();

  const [products,  setProducts]  = useState<Product[]>([]);
  const [clients,   setClients]   = useState<Client[]>([]);
  const [items,     setItems]     = useState<QuoteItem[]>([]);
  const [clientId,  setClientId]  = useState('');
  const [clientName, setClientName] = useState('');
  const [clientRnc, setClientRnc] = useState('');
  const [notes,     setNotes]     = useState('');
  const [validDays, setValidDays] = useState(15);
  const [search,    setSearch]    = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const color = session?.primaryColor ?? '#0EA5E9';

  useEffect(() => {
    if (!session?.companyId) return;
    Promise.all([
      fetch(`/api/sistema/products?companyId=${session.companyId}`).then(r => r.json()),
      fetch(`/api/sistema/clients?companyId=${session.companyId}`).then(r => r.json()),
    ]).then(([p, c]) => { setProducts(p.products ?? []); setClients(c.clients ?? []); });
  }, [session?.companyId]);

  function addProduct(product: Product) {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(prev => prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems(prev => [...prev, {
        productId: product.id, productName: product.name, productCode: product.code,
        qty: 1, price: product.price, unit: product.unit ?? 'unidad',
        discount: 0, taxable: product.taxable,
      }]);
    }
    setSearch('');
  }

  function updateItem(idx: number, field: keyof QuoteItem, value: any) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function selectClient(client: Client) {
    setClientId(client.id); setClientName(client.name); setClientRnc(client.rnc);
  }

  const subtotal  = items.reduce((sum, i) => sum + i.price * i.qty * (1 - i.discount / 100), 0);
  const taxAmount = items.reduce((sum, i) => i.taxable ? sum + i.price * i.qty * (1 - i.discount / 100) * TAX_RATE : sum, 0);
  const total     = subtotal + taxAmount;

  const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000)
    .toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  async function handleSave(status: 'draft' | 'sent') {
    if (items.length === 0) { setError('Agrega al menos un producto'); return; }
    setSaving(true); setError('');
    try {
      const validDate = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await fetch('/api/sistema/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: session!.companyId,
          clientName: clientName || 'Sin nombre',
          clientRnc, items, subtotal, tax: taxAmount, total,
          notes, validUntil: validDate, createdBy: session!.label, status,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push(`/sistema/${slug}/cotizaciones`);
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <button onClick={() => router.back()}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Cotizaciones
            </button>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em' }}>
              📋 Nueva cotización
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleSave('draft')} disabled={saving}
              style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              Guardar borrador
            </button>
            <button onClick={() => handleSave('sent')} disabled={saving}
              style={{ padding: '9px 20px', borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 2px 10px ${color}40` }}>
              {saving ? 'Guardando...' : 'Crear y enviar →'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

          {/* Columna izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Cliente */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px' }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 14 }}>👤 Cliente</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Nombre del cliente</label>
                  <input value={clientName} onChange={e => setClientName(e.target.value)}
                    placeholder="Nombre o empresa" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = color)}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.12)')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>RNC / Cédula</label>
                  <input value={clientRnc} onChange={e => setClientRnc(e.target.value)}
                    placeholder="001-1234567-8" style={{ ...inputStyle, fontFamily: 'monospace' }}
                    onFocus={e => (e.target.style.borderColor = color)}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.12)')}
                  />
                </div>
              </div>
              {/* Clientes guardados */}
              {clients.length > 0 && (
                <div>
                  <label style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>O selecciona un cliente registrado</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {clients.slice(0, 8).map(c => (
                      <button key={c.id} onClick={() => selectClient(c)}
                        style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${clientId === c.id ? color : 'rgba(255,255,255,.1)'}`, background: clientId === c.id ? `${color}15` : 'rgba(255,255,255,.04)', color: clientId === c.id ? color : 'rgba(255,255,255,.5)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Búsqueda de productos */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px' }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 12 }}>🔍 Agregar productos</h3>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar producto por nombre o código..."
                  style={{ ...inputStyle, paddingLeft: 12 }}
                  onFocus={e => (e.target.style.borderColor = color)}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.12)')}
                />
              </div>
              {search && filteredProducts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredProducts.map(p => {
                    const unit = getUnit(p.unit ?? 'unidad');
                    return (
                      <button key={p.id} onClick={() => addProduct(p)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F8FAFC' }}>{p.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', fontFamily: 'monospace' }}>{p.code}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color }}>RD${p.price.toLocaleString()}/{unit.short}</div>
                          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.35)' }}>{p.stock} {unit.short}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Items de la cotización */}
            {items.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 14 }}>
                  📦 Productos ({items.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map((item, idx) => {
                    const unit = getUnit(item.unit ?? 'unidad');
                    const sub  = item.price * item.qty * (1 - item.discount / 100);
                    return (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 70px 90px 28px', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,.07)' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F8FAFC' }}>{item.productName}</div>
                          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.35)', fontFamily: 'monospace' }}>{item.productCode} · RD${item.price.toLocaleString()}/{unit.short}</div>
                        </div>
                        {/* Cantidad */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <input type="number" min={unit.step} step={unit.step} value={item.qty}
                            onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '5px 6px', color: '#F8FAFC', fontSize: '0.78rem', outline: 'none', textAlign: 'center', fontFamily: 'monospace' }}
                          />
                          <span style={{ fontSize: '0.62rem', color: '#A78BFA', fontWeight: 600, flexShrink: 0 }}>{unit.short}</span>
                        </div>
                        {/* Precio */}
                        <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '5px 6px', color: '#F8FAFC', fontSize: '0.78rem', outline: 'none', textAlign: 'center', fontFamily: 'monospace' }}
                        />
                        {/* Descuento */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <input type="number" min="0" max="100" value={item.discount || ''} placeholder="0%"
                            onChange={e => updateItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '5px 6px', color: '#F8FAFC', fontSize: '0.78rem', outline: 'none', textAlign: 'center', fontFamily: 'monospace' }}
                          />
                          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,.3)' }}>%</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color, textAlign: 'right' }}>
                          RD${sub.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </div>
                        <button onClick={() => removeItem(idx)}
                          style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#F87171', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha — Resumen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Validez */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '16px' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 10 }}>📅 Validez</h3>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {[7, 15, 30, 60].map(d => (
                  <button key={d} onClick={() => setValidDays(d)}
                    style={{ flex: 1, padding: '6px', borderRadius: 8, border: `1px solid ${validDays === d ? color : 'rgba(255,255,255,.1)'}`, background: validDays === d ? `${color}15` : 'rgba(255,255,255,.04)', color: validDays === d ? color : 'rgba(255,255,255,.5)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {d}d
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.35)' }}>Válida hasta: {validUntil}</div>
            </div>

            {/* Notas */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '16px' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 10 }}>📝 Notas</h3>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Condiciones de pago, términos, observaciones..."
                style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '8px 10px', color: '#F8FAFC', fontSize: '0.78rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {/* Totales */}
            <div style={{ background: items.length > 0 ? `${color}08` : 'rgba(255,255,255,.03)', border: `1px solid ${items.length > 0 ? color + '25' : 'rgba(255,255,255,.08)'}`, borderRadius: 14, padding: '16px' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 12 }}>💰 Totales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Row label="Subtotal"    val={`RD$${subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`} />
                <Row label="ITBIS (18%)" val={`RD$${taxAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`} />
                <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC' }}>Total</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: items.length > 0 ? color : 'rgba(255,255,255,.3)' }}>
                    RD${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ padding: '9px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, fontSize: '0.78rem', color: '#F87171' }}>
                {error}
              </div>
            )}

            <button onClick={() => handleSave('sent')} disabled={saving || items.length === 0}
              style={{ padding: '12px', borderRadius: 12, background: saving || items.length === 0 ? 'rgba(255,255,255,.1)' : color, color: '#fff', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: saving || items.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: items.length > 0 ? `0 4px 14px ${color}40` : 'none' }}>
              {saving ? 'Guardando...' : '📋 Crear cotización'}
            </button>
          </div>
        </div>
      </div>
    </SistemaLayout>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,.45)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem',
  outline: 'none', fontFamily: 'inherit',
};

function Row({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
      <span style={{ color: 'rgba(255,255,255,.4)' }}>{label}</span>
      <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{val}</span>
    </div>
  );
}