'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DEFAULT_UNIT, getUnit, getUnitsForTemplate } from '@/lib/units';
import { getCompany } from '@/lib/db/companies';
import { TEMPLATES } from '@/lib/types';

interface Product {
  id:       string;
  code:     string;
  name:     string;
  price:    number;
  cost:     number;
  stock:    number;
  unit:     string;
  category: string;
  taxable:  boolean;
  barcode:  string;
  isActive: boolean;
}

const EMPTY = {
  code: '', name: '', price: 0, cost: 0,
  stock: 0, unit: DEFAULT_UNIT, category: '', taxable: true, barcode: '',
};

export default function ProductosPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Product | null>(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);

  const selectedUnit = getUnit(form.unit);
  const template     = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES.find(t => t.id === 'custom')!;
  const availableUnits = getUnitsForTemplate(template.unitIds);
  const quickUnitIds  = template.unitIds.length ? template.unitIds.slice(0, 6) : ['unidad','lb','kg','litro','metro','yarda'];

  function load() {
    setLoading(true);
    fetch(`/api/portal/products?companyId=${companyId}`)
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
    getCompany(companyId).then(c => setTemplateId(c?.templateId ?? null));
  }

  useEffect(() => { load(); }, [companyId]);

  function openNew() {
    setEditing(null); setForm(EMPTY); setError(''); setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({ code: p.code, name: p.name, price: p.price, cost: p.cost, stock: p.stock, unit: p.unit ?? DEFAULT_UNIT, category: p.category, taxable: p.taxable, barcode: p.barcode });
    setError(''); setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.code) { setError('Nombre y código son requeridos'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/portal/products', {
        method:  editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, companyId, id: editing?.id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowForm(false); load();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function toggleActive(p: Product) {
    await fetch('/api/portal/products', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: p.id, companyId, isActive: !p.isActive }),
    });
    load();
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Link href={`/portal/dashboard/empresa/${companyId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.4)', fontSize: '0.78rem', textDecoration: 'none', marginBottom: 20 }}>
        ← Empresa
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 3 }}>{template.productLabel.plural}</h1>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>{products.length} {(products.length !== 1 ? template.productLabel.plural : template.productLabel.singular).toLowerCase()} registrado{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          style={{ padding: '9px 20px', borderRadius: 11, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(14,165,233,.3)' }}>
          + Agregar {template.productLabel.singular.toLowerCase()}
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o código..."
          style={{ width: '100%', paddingLeft: 32, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 16 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</div>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.85rem', marginBottom: 16 }}>
            {search ? 'Sin resultados' : `No hay ${template.productLabel.plural.toLowerCase()}. ¡Agrega el primero!`}
          </p>
          {!search && (
            <button onClick={openNew} style={{ padding: '9px 20px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}>
              + Agregar {template.productLabel.singular.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 70px 100px 100px 80px 60px 80px', padding: '10px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            {['Código','Nombre','Unidad','Precio','Costo','Stock','ITBIS','Acción'].map(h => (
              <div key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {filtered.map((p, i) => {
            const unit = getUnit(p.unit ?? DEFAULT_UNIT);
            return (
              <div key={p.id}
                style={{ display: 'grid', gridTemplateColumns: '80px 1fr 70px 100px 100px 80px 60px 80px', padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', alignItems: 'center', opacity: p.isActive ? 1 : 0.45 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#0EA5E9' }}>{p.code}</div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F8FAFC' }}>{p.name}</div>
                  {p.category && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)' }}>{p.category}</div>}
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: 'rgba(139,92,246,.12)', color: '#A78BFA' }}>
                    {unit.short}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC' }}>RD${p.price.toLocaleString()}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)' }}>RD${p.cost.toLocaleString()}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: p.stock <= 0 ? '#EF4444' : p.stock <= 5 ? '#F59E0B' : '#34D399' }}>
                  {unit.decimal ? p.stock.toLocaleString('es-DO', { maximumFractionDigits: 3 }) : p.stock} {unit.short}
                </div>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: p.taxable ? 'rgba(14,165,233,.1)' : 'rgba(255,255,255,.06)', color: p.taxable ? '#38BDF8' : 'rgba(255,255,255,.4)' }}>
                    {p.taxable ? '18%' : 'No'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => openEdit(p)} style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#F8FAFC', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>Editar</button>
                  <button onClick={() => toggleActive(p)} style={{ padding: '4px 8px', borderRadius: 7, background: p.isActive ? 'rgba(239,68,68,.08)' : 'rgba(16,185,129,.08)', border: `1px solid ${p.isActive ? 'rgba(239,68,68,.2)' : 'rgba(16,185,129,.2)'}`, color: p.isActive ? '#F87171' : '#34D399', fontSize: '0.65rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.isActive ? 'Off' : 'On'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
                {editing ? `Editar ${template.productLabel.singular.toLowerCase()}` : `Agregar ${template.productLabel.singular.toLowerCase()}`}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Código *" value={form.code} onChange={v => setForm(f => ({ ...f, code: v }))} placeholder="P001" />
                <Field label="Nombre *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Queso Cheddar" />

                {/* Unidad de medida */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Unidad de medida *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, marginBottom: 8 }}>
                    {/* Acceso rápido a las más comunes para este tipo de negocio */}
                    {quickUnitIds.map(uid => {
                      const u = getUnit(uid);
                      return (
                        <button key={uid} type="button" onClick={() => setForm(f => ({ ...f, unit: uid }))}
                          style={{ padding: '7px 4px', borderRadius: 8, border: `1px solid ${form.unit === uid ? '#8B5CF6' : 'rgba(255,255,255,.1)'}`, background: form.unit === uid ? 'rgba(139,92,246,.15)' : 'rgba(255,255,255,.04)', color: form.unit === uid ? '#A78BFA' : 'rgba(255,255,255,.5)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                          <div>{u.short}</div>
                          <div style={{ fontSize: '0.6rem', opacity: .7 }}>{u.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Select completo */}
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}>
                    {availableUnits.map(u => (
                      <option key={u.id} value={u.id}>{u.label} ({u.short}) {u.decimal ? '— decimal' : '— entero'}</option>
                    ))}
                  </select>
                  {selectedUnit.decimal && (
                    <p style={{ fontSize: '0.68rem', color: '#A78BFA', marginTop: 5 }}>
                      ✓ Permite cantidades decimales (0.5 {selectedUnit.short}, 1.25 {selectedUnit.short}, etc.)
                    </p>
                  )}
                </div>

                <Field label={`Precio de venta (RD$ / ${selectedUnit.short}) *`} value={String(form.price || '')} type="number" onChange={v => setForm(f => ({ ...f, price: parseFloat(v) || 0 }))} placeholder="0.00" />
                <Field label="Costo (RD$)" value={String(form.cost || '')} type="number" onChange={v => setForm(f => ({ ...f, cost: parseFloat(v) || 0 }))} placeholder="0.00" />

                <Field
                  label={`Stock inicial (en ${selectedUnit.short})`}
                  value={String(form.stock || '')}
                  type="number"
                  step={selectedUnit.step}
                  onChange={v => setForm(f => ({ ...f, stock: selectedUnit.decimal ? parseFloat(v) || 0 : parseInt(v) || 0 }))}
                  placeholder={selectedUnit.decimal ? '0.00' : '0'}
                />
                <Field label="Categoría" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} placeholder="General" />
                <Field label="Barcode (opcional)" value={form.barcode} onChange={v => setForm(f => ({ ...f, barcode: v }))} placeholder="7896543210123" />

                {/* ITBIS */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ITBIS</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ v: true, l: 'Aplica 18%' }, { v: false, l: 'No aplica' }].map(opt => (
                      <button key={String(opt.v)} type="button" onClick={() => setForm(f => ({ ...f, taxable: opt.v }))}
                        style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${form.taxable === opt.v ? '#0EA5E9' : 'rgba(255,255,255,.1)'}`, background: form.taxable === opt.v ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.04)', color: form.taxable === opt.v ? '#38BDF8' : 'rgba(255,255,255,.5)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Margen */}
              {form.price > 0 && form.cost > 0 && (
                <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 10, fontSize: '0.78rem', color: '#34D399' }}>
                  Margen: RD${(form.price - form.cost).toLocaleString()} ({Math.round((form.price - form.cost) / form.price * 100)}%)
                </div>
              )}

              {error && (
                <div style={{ padding: '9px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 9, fontSize: '0.78rem', color: '#F87171' }}>{error}</div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '9px 20px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '9px 24px', borderRadius: 10, background: saving ? 'rgba(14,165,233,.4)' : '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', step }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; step?: number;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} step={step}
        style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
        onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
        onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.12)')}
      />
    </div>
  );
}