'use client';
import Link from 'next/link';

export function EmptyCompanies() {
  return (
    <div style={{
      textAlign: 'center', padding: '72px 24px',
      background: 'rgba(255,255,255,.02)',
      border: '1px dashed rgba(255,255,255,.1)',
      borderRadius: 20,
    }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 18 }}>🏢</div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
        Ningún sistema todavía
      </h2>
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.35)', maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.8 }}>
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
  );
}