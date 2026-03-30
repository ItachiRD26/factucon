'use client';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?:    'sm' | 'md' | 'lg';
  loading?: boolean;
}

const VARIANTS = {
  primary:   { background: '#0EA5E9', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(14,165,233,.3)' },
  secondary: { background: 'rgba(255,255,255,.07)', color: '#F8FAFC', border: '1px solid rgba(255,255,255,.12)' },
  ghost:     { background: 'transparent', color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.08)' },
  danger:    { background: 'rgba(239,68,68,.1)', color: '#F87171', border: '1px solid rgba(239,68,68,.2)' },
};
const SIZES = {
  sm: { padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8 },
  md: { padding: '9px 18px', fontSize: '0.85rem', borderRadius: 10 },
  lg: { padding: '12px 24px', fontSize: '0.95rem', borderRadius: 12 },
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, style, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? .5 : 1, transition: 'all .13s',
        fontFamily: 'inherit',
        ...VARIANTS[variant], ...SIZES[size], ...style,
      }}
      {...props}
    >
      {loading && <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }}/>}
      {children}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}