'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { getCompaniesByOwner } from '@/lib/db/companies';
import { CompanyCard } from '@/components/dashboard/company-card';
import { Company } from '@/lib/types';

export default function DashboardPage() {
  const { user, portalUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    getCompaniesByOwner(user.uid)
      .then(setCompanies)
      .finally(() => setLoading(false));
  }, [user]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const firstName = portalUser?.displayName?.split(' ')[0] ?? 'Usuario';

  const statusCount = {
    active:   companies.filter(c => c.subscription.status === 'active').length,
    trial:    companies.filter(c => c.subscription.status === 'trial').length,
    blocked:  companies.filter(c => ['blocked','inactive'].includes(c.subscription.status)).length,
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 4 }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.35)' }}>
          {loading ? 'Cargando...' : companies.length === 0
            ? 'Aún no tienes ningún sistema de facturación. ¡Crea el primero!'
            : `Tienes ${companies.length} sistema${companies.length !== 1 ? 's' : ''} de facturación`
          }
        </p>
      </div>

      {/* Stats rápidas */}
      {companies.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Activos',   val: statusCount.active,  color: '#10B981', bg: 'rgba(16,185,129,.08)',  icon: '✅' },
            { label: 'En prueba', val: statusCount.trial,   color: '#0EA5E9', bg: 'rgba(14,165,233,.08)',  icon: '⭐' },
            { label: 'Bloqueados',val: statusCount.blocked, color: '#EF4444', bg: 'rgba(239,68,68,.08)',   icon: '🔒' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.color}30`,
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              height: 220, borderRadius: 16,
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}/>
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && companies.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)',
          borderRadius: 20,
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🏢</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
            Ningún sistema todavía
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.35)', maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.75 }}>
            Crea tu primer sistema de facturación en minutos. Elige una plantilla, configura tus módulos y empieza a facturar.
          </p>
          <Link href="/portal/dashboard/wizard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: '0.88rem', fontWeight: 700, color: '#fff',
            padding: '11px 24px', borderRadius: 12,
            background: '#0EA5E9', textDecoration: 'none',
            boxShadow: '0 2px 14px rgba(14,165,233,.35)',
          }}>
            + Crear mi primer sistema
          </Link>
        </div>
      )}

      {/* Company grid */}
      {!loading && companies.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {companies.map(c => <CompanyCard key={c.id} company={c} />)}

            {/* Card "agregar nueva" */}
            <Link href="/portal/dashboard/wizard" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: '32px 24px', borderRadius: 16, textDecoration: 'none',
              border: '1px dashed rgba(255,255,255,.12)', background: 'rgba(255,255,255,.02)',
              transition: 'all .18s', minHeight: 200,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(14,165,233,.1)', border: '1px solid rgba(14,165,233,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
              }}>➕</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                  Agregar empresa
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.3)' }}>
                  Crea otro sistema de facturación
                </div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* AI Chat widget flotante */}
      <AIChatButton />
    </div>
  );
}

function AIChatButton() {
  const [open, setOpen] = useState(false);
  const [msg,  setMsg]  = useState('');
  const [msgs, setMsgs] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: '¡Hola! Soy el asistente de Factucon. ¿En qué puedo ayudarte hoy?' },
  ]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!msg.trim() || loading) return;
    const userMsg = msg.trim();
    setMsg('');
    setMsgs(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res  = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { role: 'ai', text: data.reply ?? 'Lo siento, ocurrió un error.' }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'ai', text: 'Error de conexión. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, width: 340,
          background: '#0F1E35', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 20, overflow: 'hidden', zIndex: 200,
          boxShadow: '0 20px 60px rgba(0,0,0,.5)',
        }}>
          {/* Head */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,.2)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#0EA5E9,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Asistente Factucon</div>
              <div style={{ fontSize: '0.62rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}/>
                En línea
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          {/* Messages */}
          <div style={{ padding: 14, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                maxWidth: '82%', fontSize: '0.75rem', lineHeight: 1.6, padding: '8px 12px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.06)',
                border: m.role === 'user' ? '1px solid rgba(14,165,233,.25)' : '1px solid rgba(255,255,255,.08)',
                color: m.role === 'user' ? '#e0f2fe' : 'rgba(255,255,255,.7)',
              }}>{m.text}</div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '4px 12px 12px 12px', width: 'fit-content' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.4)', animation: `typing .8s ease-in-out ${i*0.15}s infinite` }}/>
                ))}
                <style>{`@keyframes typing{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}`}</style>
              </div>
            )}
          </div>
          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 8 }}>
            <input
              value={msg} onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribe tu pregunta..."
              style={{ flex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '7px 10px', fontSize: '0.75rem', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={send} disabled={loading}
              style={{ width: 32, height: 32, borderRadius: 8, background: '#0EA5E9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 24, right: 24, width: 52, height: 52,
        borderRadius: 16, background: 'linear-gradient(135deg,#0EA5E9,#8B5CF6)',
        border: 'none', cursor: 'pointer', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(14,165,233,.4)', fontSize: 20,
        transition: 'transform .2s',
      }}>
        {open ? '✕' : '🤖'}
      </button>
    </>
  );
}