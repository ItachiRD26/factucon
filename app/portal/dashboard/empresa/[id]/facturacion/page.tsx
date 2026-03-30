'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCodesByCompany } from '@/lib/db/codes';
import { getCompany } from '@/lib/db/companies';
import { ActivationCode, Company } from '@/lib/types';

const ROLE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  owner:   { label: 'Propietario',   icon: '👑', color: '#F59E0B' },
  admin:   { label: 'Admin',         icon: '⭐', color: '#0EA5E9' },
  cashier: { label: 'Cajero',        icon: '💰', color: '#10B981' },
};

export default function UsuariosPage() {
  const { id }    = useParams<{ id: string }>();
  const [codes,   setCodes]   = useState<ActivationCode[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCodesByCompany(id), getCompany(id)])
      .then(([c, co]) => { setCodes(c); setCompany(co); })
      .finally(() => setLoading(false));
  }, [id]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,.4)' }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link href={`/portal/dashboard/empresa/${id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.4)', fontSize: '0.78rem', textDecoration: 'none', marginBottom: 20 }}>
        ← {company?.name ?? 'Empresa'}
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 3 }}>
            Códigos de activación
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>
            Cada código activa el sistema en una PC con el rol asignado
          </p>
        </div>
      </div>

      {/* Instrucciones */}
      <div style={{ padding: '14px 18px', background: 'rgba(14,165,233,.06)', border: '1px solid rgba(14,165,233,.2)', borderRadius: 12, marginBottom: 20, fontSize: '0.78rem', color: '#38BDF8', lineHeight: 1.7 }}>
        <strong>¿Cómo usar los códigos?</strong><br/>
        1. Ve a <span style={{ fontFamily: 'monospace' }}>{company?.slug}.https://factucon.vercel.app/</span> desde la PC que quieres activar<br/>
        2. Ingresa el código correspondiente a ese usuario<br/>
        3. El sistema cargará automáticamente con el rol y permisos asignados
      </div>

      {codes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 16 }}>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.85rem' }}>No hay códigos generados todavía.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {codes.map(c => {
            const role = ROLE_CONFIG[c.role] ?? { label: c.role, icon: '👤', color: '#94A3B8' };
            return (
              <div key={c.code} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${role.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {role.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#0EA5E9', letterSpacing: '0.05em' }}>{c.code}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${role.color}18`, color: role.color }}>
                    {role.label}
                  </span>
                  <button onClick={() => copyCode(c.code)}
                    style={{ padding: '5px 12px', borderRadius: 8, background: copied === c.code ? 'rgba(16,185,129,.15)' : 'rgba(255,255,255,.07)', border: `1px solid ${copied === c.code ? 'rgba(16,185,129,.3)' : 'rgba(255,255,255,.12)'}`, color: copied === c.code ? '#34D399' : '#F8FAFC', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                    {copied === c.code ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}