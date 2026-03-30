'use client';
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, ...props }, ref) => (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        style={{
          width: '100%', background: 'rgba(255,255,255,.06)', color: '#F8FAFC',
          border: `1px solid ${error ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.12)'}`,
          borderRadius: 10, padding: '10px 14px', fontSize: '0.88rem',
          outline: 'none', fontFamily: 'inherit', transition: 'border-color .13s',
          ...style,
        }}
        onFocus={e => { e.target.style.borderColor = error ? '#EF4444' : '#0EA5E9'; }}
        onBlur={e  => { e.target.style.borderColor = error ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.12)'; }}
        {...props}
      />
      {error && <p style={{ fontSize: '0.72rem', color: '#F87171', marginTop: 4 }}>{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';