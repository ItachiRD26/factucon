'use client';
import { useState, useEffect } from 'react';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';
import type { SubtipoJuridica } from '@/lib/dgii/types';

interface Client {
  id: string; name: string; rnc: string; phone: string;
  email: string; address: string; creditLimit: number;
  balance: number; isActive: boolean; subtipoFiscal: SubtipoJuridica;
}

const SUBTIPOS_FISCALES: { value: SubtipoJuridica; label: string }[] = [
  { value: 'regular',     label: 'Regular' },
  { value: 'gobierno',    label: 'Gubernamental' },
  { value: 'zona_franca', label: 'Zona franca' },
  { value: 'exportacion', label: 'Exportación' },
];

const EMPTY = { name: '', rnc: '', phone: '', email: '', address: '', creditLimit: 0, subtipoFiscal: 'regular' as SubtipoJuridica };

export default function ClientesPage() {
  const { session, loading } = useSistemaSession();
  const [clients,   setClients]   = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search,    setSearch]    = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState<Client | null>(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const color   = session?.primaryColor ?? '#0EA5E9';
  const isOwner = session?.role === 'owner' || session?.role === 'admin';

  function load() {
    if (!session?.companyId) return;
    fetch(`/api/sistema/clients?companyId=${session.companyId}`)
      .then(r => r.json())
      .then(d => setClients(d.clients ?? []))
      .finally(() => setLoadingData(false));
  }

  useEffect(() => { if (session) load(); }, [session]);

  function openNew() {
    setEditing(null); setForm(EMPTY); setError(''); setShowForm(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({ name: c.name, rnc: c.rnc, phone: c.phone, email: c.email, address: c.address, creditLimit: c.creditLimit, subtipoFiscal: c.subtipoFiscal ?? 'regular' });
    setError(''); setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { setError('El nombre es requerido'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/sistema/clients', {
        method:  editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, companyId: session!.companyId, id: editing?.id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowForm(false); load();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally { setSaving(false); }
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.rnc.includes(search) || c.phone.includes(search)
  );

  if (loading) return null;

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>👥 Clientes</h1>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>{clients.length} cliente{clients.length !== 1 ? 's' : ''}</p>
          </div>
          {isOwner && (
            <button onClick={openNew}
              style={{ padding: '9px 18px', borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}>
              + Agregar cliente
            </button>
          )}
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, RNC o teléfono..."
            style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 16 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👥</div>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.85rem' }}>
              {search ? 'Sin resultados' : 'No hay clientes. ¡Agrega el primero!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(client => (
              <div key={client.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color, flexShrink: 0 }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 2 }}>{client.name}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {client.rnc   && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)', fontFamily: 'monospace' }}>RNC: {client.rnc}</span>}
                    {client.phone && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)' }}>📞 {client.phone}</span>}
                    {client.email && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.4)' }}>✉ {client.email}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {client.creditLimit > 0 && (
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.3)' }}>Crédito disponible</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: client.balance <= 0 ? '#34D399' : '#F87171' }}>
                        RD${(client.creditLimit - client.balance).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {isOwner && (
                    <button onClick={() => openEdit(client)}
                      style={{ padding: '4px 12px', borderRadius: 7, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#F8FAFC', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Editar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, width: '100%', maxWidth: 500, overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>{editing ? 'Editar cliente' : 'Nuevo cliente'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Nombre *', 'name', 'text', 'Juan Rodríguez'],
                  ['RNC / Cédula', 'rnc', 'text', '001-1234567-8'],
                  ['Teléfono', 'phone', 'tel', '809-000-0000'],
                  ['Email', 'email', 'email', 'juan@email.com'],
                  ['Límite de crédito (RD$)', 'creditLimit', 'number', '0'],
                ].map(([label, field, type, ph]) => (
                  <div key={field} style={{ gridColumn: field === 'name' || field === 'address' ? '1/-1' : 'auto' }}>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                    <input type={type} value={(form as any)[field]} placeholder={ph}
                      onChange={e => setForm(f => ({ ...f, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                      style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, padding: '8px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle, ciudad..."
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, padding: '8px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de cliente fiscal</label>
                <select value={form.subtipoFiscal} onChange={e => setForm(f => ({ ...f, subtipoFiscal: e.target.value as SubtipoJuridica }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, padding: '8px 12px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}>
                  {SUBTIPOS_FISCALES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {error && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, fontSize: '0.78rem', color: '#F87171' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '9px 22px', borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SistemaLayout>
  );
}