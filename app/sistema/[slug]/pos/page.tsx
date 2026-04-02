'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';

interface Product {
  id: string; code: string; name: string;
  price: number; stock: number; category: string;
  taxable: boolean; barcode?: string;
}
interface CartItem { product: Product; qty: number; discount: number; }
interface Client {
  id: string; name: string; rnc: string; phone: string;
  creditLimit: number; balance: number;
}

const TAX_RATE = 0.18;

const NCF_TYPES = [
  { id: 'B02', label: 'B02 — Consumidor Final' },
  { id: 'B01', label: 'B01 — Crédito Fiscal' },
  { id: 'B14', label: 'B14 — Gubernamental' },
  { id: 'B15', label: 'B15 — Regímenes Especiales' },
  { id: 'B16', label: 'B16 — Exportaciones' },
];

const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Efectivo',      icon: '💵' },
  { id: 'card',     label: 'Tarjeta',       icon: '💳' },
  { id: 'transfer', label: 'Transferencia', icon: '🏦' },
  { id: 'credit',   label: 'Crédito',       icon: '📋' },
];

export default function POSPage() {
  const { slug }             = useParams<{ slug: string }>();
  const { session, loading } = useSistemaSession();

  const [products,     setProducts]     = useState<Product[]>([]);
  const [clients,      setClients]      = useState<Client[]>([]);
  const [cart,         setCart]         = useState<CartItem[]>([]);
  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('all');
  const [ncfType,      setNcfType]      = useState('B02');
  const [payMethod,    setPayMethod]    = useState('cash');
  const [amountPaid,   setAmountPaid]   = useState('');
  const [cardRef,      setCardRef]      = useState('');         // comprobante tarjeta
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loadingProds, setLoadingProds] = useState(true);
  const [processing,   setProcessing]   = useState(false);
  const [saleSuccess,  setSaleSuccess]  = useState<{ saleNumber: string; change: number } | null>(null);

  // Modales
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditSearch,    setCreditSearch]    = useState('');

  const color = session?.primaryColor ?? '#0EA5E9';

  useEffect(() => {
    if (!session?.companyId) return;
    Promise.all([
      fetch(`/api/sistema/products?companyId=${session.companyId}`).then(r => r.json()),
      fetch(`/api/sistema/clients?companyId=${session.companyId}`).then(r => r.json()),
    ]).then(([p, c]) => {
      setProducts(p.products ?? []);
      setClients(c.clients  ?? []);
    }).finally(() => setLoadingProds(false));
  }, [session?.companyId]);

  // Cuando seleccionan crédito → abrir modal
  function handlePayMethodChange(method: string) {
    if (method === 'credit') {
      setShowCreditModal(true);
      setCreditSearch('');
      return;
    }
    setPayMethod(method);
    setSelectedClient(null);
    setCardRef('');
  }

  function confirmCreditClient(client: Client) {
    const available = client.creditLimit - client.balance;
    if (available < total) {
      alert(`Crédito insuficiente. Disponible: RD$${available.toLocaleString()}`);
      return;
    }
    setSelectedClient(client);
    setPayMethod('credit');
    setShowCreditModal(false);
    setNcfType('B01'); // crédito fiscal por defecto cuando hay cliente
  }

  function cancelCreditModal() {
    setShowCreditModal(false);
    setPayMethod('cash'); // volver a efectivo si cancela
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.code.toLowerCase().includes(search.toLowerCase()) ||
                        (p.barcode ?? '').includes(search);
    const matchCat    = category === 'all' || p.category === category;
    return matchSearch && matchCat && p.stock > 0;
  });

  const subtotal  = cart.reduce((sum, i) => sum + i.product.price * i.qty * (1 - i.discount / 100), 0);
  const taxAmount = cart.reduce((sum, i) => {
    if (!i.product.taxable) return sum;
    return sum + i.product.price * i.qty * (1 - i.discount / 100) * TAX_RATE;
  }, 0);
  const total  = subtotal + taxAmount;
  const change = parseFloat(amountPaid || '0') - total;

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1, discount: 0 }];
    });
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) setCart(prev => prev.filter(i => i.product.id !== id));
    else setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  }

  function updateDiscount(id: string, discount: number) {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, discount: Math.min(100, Math.max(0, discount)) } : i));
  }

  // Validación del botón cobrar
  const canProcess = cart.length > 0 &&
    (payMethod === 'cash'     ? parseFloat(amountPaid || '0') >= total :
     payMethod === 'card'     ? cardRef.trim().length > 0 :
     payMethod === 'credit'   ? selectedClient !== null :
     true /* transfer */);

  async function processSale() {
    if (!session || !canProcess) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/sistema/sales', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId:    session.companyId,
          cashierId:    session.label,
          cashierName:  session.label,
          items:        cart.map(i => ({
            productId:   i.product.id,
            productName: i.product.name,
            productCode: i.product.code,
            qty:         i.qty,
            price:       i.product.price,
            discount:    i.discount,
            taxable:     i.product.taxable,
          })),
          subtotal, tax: taxAmount, total,
          paymentMethod: payMethod,
          amountPaid:   payMethod === 'cash' ? parseFloat(amountPaid) : total,
          change:       payMethod === 'cash' ? Math.max(0, change) : 0,
          cardReference: payMethod === 'card' ? cardRef.trim() : null,
          customer: selectedClient ? {
            id:    selectedClient.id,
            name:  selectedClient.name,
            rnc:   selectedClient.rnc,
          } : null,
          ncfType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaleSuccess({ saleNumber: data.saleNumber, change: payMethod === 'cash' ? Math.max(0, change) : 0 });
      setCart([]); setAmountPaid(''); setSearch('');
      setCardRef(''); setSelectedClient(null); setPayMethod('cash');
    } catch (e: any) {
      alert(e.message ?? 'Error procesando la venta');
    } finally { setProcessing(false); }
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(creditSearch.toLowerCase()) ||
    c.rnc.includes(creditSearch) || c.phone.includes(creditSearch)
  ).filter(c => c.creditLimit > 0); // solo clientes con crédito

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, height: 'calc(100vh - 72px)', overflow: 'hidden' }}>

        {/* ── Columna izquierda: Productos ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="13" height="13" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto, código o barcode..."
              style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = color)}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ padding: '5px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: category === cat ? color : 'rgba(255,255,255,.07)', color: category === cat ? '#fff' : 'rgba(255,255,255,.5)' }}>
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, alignContent: 'start' }}>
            {loadingProds ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.3)', fontSize: '0.82rem' }}>Cargando productos...</div>
            ) : filtered.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.3)', fontSize: '0.82rem' }}>
                {search ? `Sin resultados para "${search}"` : 'No hay productos disponibles'}
              </div>
            ) : filtered.map(product => {
              const inCart      = cart.find(i => i.product.id === product.id);
              const borderColor = inCart ? color + '50' : 'rgba(255,255,255,.08)';
              const bgColor     = inCart ? color + '15' : 'rgba(255,255,255,.04)';
              return (
                <button key={product.id} onClick={() => addToCart(product)}
                  style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 12, padding: '14px 10px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', position: 'relative' }}>
                  {inCart && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                      {inCart.qty}
                    </div>
                  )}
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.3)', marginBottom: 4, fontFamily: 'monospace' }}>{product.code}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F8FAFC', marginBottom: 6, lineHeight: 1.3 }}>{product.name}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: color }}>RD${product.price.toLocaleString()}</div>
                  <div style={{ fontSize: '0.62rem', marginTop: 3, color: product.stock <= 5 ? '#F87171' : 'rgba(255,255,255,.3)' }}>{product.stock} en stock</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Columna derecha: Carrito ── */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
              🛒 Carrito
              {cart.length > 0 && <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: color + '20', color }}>{cart.length}</span>}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} style={{ fontSize: '0.72rem', color: '#F87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Limpiar</button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,.2)', fontSize: '0.78rem', gap: 8 }}>
                <span style={{ fontSize: '2rem' }}>🛒</span>
                Agrega productos al carrito
              </div>
            ) : cart.map(item => (
              <div key={item.product.id} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.35)' }}>RD${item.product.price.toLocaleString()} c/u</div>
                  </div>
                  <button onClick={() => updateQty(item.product.id, 0)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.2)', cursor: 'pointer', fontSize: 14, padding: '0 0 0 8px', flexShrink: 0 }}>✕</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => updateQty(item.product.id, item.qty - 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#F8FAFC', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => item.qty < item.product.stock && updateQty(item.product.id, item.qty + 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#F8FAFC', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: item.qty >= item.product.stock ? 0.4 : 1 }}>+</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)' }}>Desc%</span>
                    <input type="number" min="0" max="100" value={item.discount || ''}
                      onChange={e => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      style={{ width: 44, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '3px 6px', color: '#F8FAFC', fontSize: '0.75rem', outline: 'none', textAlign: 'center', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: color }}>
                    RD${(item.product.price * item.qty * (1 - item.discount / 100)).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '12px 14px' }}>

              {/* NCF */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comprobante fiscal</label>
                <select value={ncfType} onChange={e => setNcfType(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '7px 10px', color: '#F8FAFC', fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit' }}>
                  {NCF_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {/* Totales */}
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                <PriceRow label="Subtotal"    val={`RD$${subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`} />
                <PriceRow label="ITBIS (18%)" val={`RD$${taxAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`} />
                <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 6, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC' }}>Total</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: color }}>RD${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Métodos de pago */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 10 }}>
                {PAYMENT_METHODS.map(m => {
                  const isActive   = payMethod === m.id;
                  return (
                    <button key={m.id} onClick={() => handlePayMethodChange(m.id)}
                      style={{ padding: '6px 4px', borderRadius: 8, border: `1px solid ${isActive ? color : 'rgba(255,255,255,.1)'}`, background: isActive ? color + '15' : 'rgba(255,255,255,.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                      <span style={{ fontSize: 14 }}>{m.icon}</span>
                      <span style={{ fontSize: '0.58rem', fontWeight: 600, color: isActive ? color : 'rgba(255,255,255,.4)' }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cliente crédito seleccionado */}
              {payMethod === 'credit' && selectedClient && (
                <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(14,165,233,.08)', border: '1px solid rgba(14,165,233,.2)', borderRadius: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F8FAFC' }}>{selectedClient.name}</div>
                    <div style={{ fontSize: '0.65rem', color: '#38BDF8' }}>
                      Disponible: RD${(selectedClient.creditLimit - selectedClient.balance).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => { setShowCreditModal(true); setCreditSearch(''); }}
                    style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cambiar
                  </button>
                </div>
              )}

              {/* Comprobante tarjeta */}
              {payMethod === 'card' && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    # Comprobante de la terminal *
                  </label>
                  <input value={cardRef} onChange={e => setCardRef(e.target.value.toUpperCase())}
                    placeholder="Ej: 1234567890"
                    style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: `1px solid ${cardRef.trim() ? '#10B981' : 'rgba(255,255,255,.12)'}`, borderRadius: 8, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)', marginTop: 3 }}>
                    El número que aparece en el voucher de la terminal
                  </div>
                </div>
              )}

              {/* Monto pagado (solo efectivo) */}
              {payMethod === 'cash' && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monto recibido</label>
                  <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                    placeholder={`Mínimo RD$${total.toFixed(2)}`}
                    style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: `1px solid ${change >= 0 && amountPaid ? '#10B981' : 'rgba(255,255,255,.1)'}`, borderRadius: 8, padding: '8px 12px', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none', fontFamily: 'monospace' }}
                  />
                  {amountPaid && change >= 0 && (
                    <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>
                      Cambio: RD${change.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  {amountPaid && change < 0 && (
                    <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#F87171', fontWeight: 600 }}>
                      Faltan RD${Math.abs(change).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              )}

              {/* Botón cobrar */}
              <button onClick={processSale} disabled={processing || !canProcess}
                style={{ width: '100%', padding: '12px', borderRadius: 11, border: 'none', cursor: processing || !canProcess ? 'not-allowed' : 'pointer', background: processing || !canProcess ? 'rgba(255,255,255,.1)' : color, color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit', boxShadow: canProcess && !processing ? `0 4px 14px ${color}40` : 'none', transition: 'all .15s' }}>
                {processing ? 'Procesando...' : `✅ Cobrar RD$${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
              </button>

              {/* Hint de por qué está deshabilitado */}
              {!canProcess && cart.length > 0 && (
                <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#F87171', textAlign: 'center' }}>
                  {payMethod === 'cash'   && parseFloat(amountPaid || '0') < total ? 'Monto insuficiente' :
                   payMethod === 'card'   && !cardRef.trim()   ? 'Ingresa el # de comprobante de la terminal' :
                   payMethod === 'credit' && !selectedClient   ? 'Selecciona un cliente con crédito' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Crédito ── */}
      {showCreditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 2 }}>Seleccionar cliente</h3>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.35)' }}>Solo clientes con límite de crédito activo</p>
              </div>
              <button onClick={cancelCreditModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '14px 20px' }}>
              <input value={creditSearch} onChange={e => setCreditSearch(e.target.value)}
                placeholder="Buscar por nombre, RNC o teléfono..."
                autoFocus
                style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', marginBottom: 12 }}
                onFocus={e => (e.target.style.borderColor = color)}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.12)')}
              />
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredClients.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,.35)', fontSize: '0.82rem' }}>
                    {clients.filter(c => c.creditLimit > 0).length === 0
                      ? 'No hay clientes con crédito registrados'
                      : 'Sin resultados'}
                  </div>
                ) : filteredClients.map(client => {
                  const available = client.creditLimit - client.balance;
                  const hasEnough = available >= total;
                  return (
                    <button key={client.id}
                      onClick={() => hasEnough && confirmCreditClient(client)}
                      disabled={!hasEnough}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: hasEnough ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)', border: `1px solid ${hasEnough ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.05)'}`, cursor: hasEnough ? 'pointer' : 'not-allowed', textAlign: 'left', fontFamily: 'inherit', opacity: hasEnough ? 1 : 0.5, transition: 'all .13s' }}
                      onMouseOver={e => { if (hasEnough) (e.currentTarget as HTMLElement).style.borderColor = color; }}
                      onMouseOut={e  => { if (hasEnough) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.1)'; }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color, flexShrink: 0 }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: 2 }}>{client.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)' }}>
                          {client.rnc && `RNC: ${client.rnc} · `}Crédito disponible:{' '}
                          <span style={{ color: hasEnough ? '#34D399' : '#F87171', fontWeight: 700 }}>
                            RD${available.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {!hasEnough && (
                        <span style={{ fontSize: '0.62rem', color: '#F87171', flexShrink: 0 }}>Insuficiente</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'center' }}>
              <button onClick={cancelCreditModal}
                style={{ padding: '8px 24px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar — usar otro método de pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal venta exitosa ── */}
      {saleSuccess && (
        <div onClick={() => setSaleSuccess(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#0F1E35', border: `1px solid ${color}30`, borderRadius: 20, padding: '36px', textAlign: 'center', maxWidth: 320, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>¡Venta completada!</h3>
            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color, marginBottom: 8 }}>{saleSuccess.saleNumber}</div>
            {saleSuccess.change > 0 && (
              <div style={{ fontSize: '0.88rem', color: '#34D399', fontWeight: 600, marginBottom: 16 }}>
                Cambio: RD${saleSuccess.change.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
            )}
            <button onClick={() => setSaleSuccess(null)}
              style={{ padding: '10px 28px', borderRadius: 11, background: color, color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: `0 4px 14px ${color}40`, fontFamily: 'inherit' }}>
              Nueva venta
            </button>
          </div>
        </div>
      )}
    </SistemaLayout>
  );
}

function PriceRow({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
      <span style={{ color: 'rgba(255,255,255,.4)' }}>{label}</span>
      <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{val}</span>
    </div>
  );
}