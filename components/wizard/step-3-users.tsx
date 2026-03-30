'use client';
import { WizardData } from './wizard-shell';

interface Props {
  data: WizardData;
  onUpdate: (p: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ROLES = [
  { id: 'owner',   label: 'Propietario',    desc: 'Acceso total al sistema',           icon: '👑' },
  { id: 'admin',   label: 'Administrador',  desc: 'Gestión sin eliminar datos clave',  icon: '⭐' },
  { id: 'cashier', label: 'Cajero',         desc: 'Solo punto de venta y cotizaciones',icon: '💰' },
];

export function Step3Users({ data, onUpdate, onNext, onBack }: Props) {
  function addUser() {
    onUpdate({ users: [...data.users, { role: 'cashier', label: `Cajero ${data.users.length}` }] });
  }

  function removeUser(i: number) {
    if (i === 0) return; // no eliminar el owner
    onUpdate({ users: data.users.filter((_, idx) => idx !== i) });
  }

  function updateUser(i: number, field: 'role' | 'label', val: string) {
    const updated = data.users.map((u, idx) => idx === i ? { ...u, [field]: val } : u);
    onUpdate({ users: updated });
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
        Define tus usuarios
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 22 }}>
        Cada usuario representa una PC o punto de acceso. Se generará un código de activación único para cada uno.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {data.users.map((u, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(14,165,233,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {ROLES.find(r => r.id === u.role)?.icon ?? '👤'}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 8 }}>
              <input value={u.label} onChange={e => updateUser(i, 'label', e.target.value)}
                placeholder="Nombre del usuario / PC"
                style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '7px 10px', color: '#F8FAFC', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
              />
              <select value={u.role} onChange={e => updateUser(i, 'role', e.target.value)}
                disabled={i === 0}
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '7px 10px', color: '#F8FAFC', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', opacity: i === 0 ? .5 : 1 }}>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            {i > 0 && (
              <button onClick={() => removeUser(i)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#F87171', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button onClick={addUser} style={{ width: '100%', padding: '10px', borderRadius: 11, background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.15)', color: 'rgba(255,255,255,.5)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', marginBottom: 28 }}>
        + Agregar usuario
      </button>

      <div style={{ padding: '12px 16px', background: 'rgba(14,165,233,.06)', border: '1px solid rgba(14,165,233,.2)', borderRadius: 10, marginBottom: 24, fontSize: '0.75rem', color: '#38BDF8' }}>
        💡 Cada usuario extra (después del primero) cuesta <strong>RD$150/mes</strong>. Total de usuarios: <strong>{data.users.length}</strong>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ padding: '10px 22px', borderRadius: 11, background: 'rgba(255,255,255,.07)', color: '#F8FAFC', fontWeight: 600, fontSize: '0.88rem', border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer' }}>
          ← Atrás
        </button>
        <button onClick={onNext} disabled={data.users.length === 0} style={{ padding: '10px 28px', borderRadius: 11, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(14,165,233,.3)' }}>
          Continuar →
        </button>
      </div>
    </div>
  );
}