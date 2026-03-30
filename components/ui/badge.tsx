// Badge
export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple' }) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)' },
    success: { background: 'rgba(16,185,129,.12)', color: '#34D399' },
    danger:  { background: 'rgba(239,68,68,.12)',  color: '#F87171' },
    warning: { background: 'rgba(245,158,11,.12)', color: '#FCD34D' },
    info:    { background: 'rgba(14,165,233,.12)', color: '#38BDF8' },
    purple:  { background: 'rgba(139,92,246,.12)', color: '#A78BFA' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px',
      borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.04em',
      ...styles[variant],
    }}>
      {children}
    </span>
  );
}

import React from 'react';