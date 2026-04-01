'use client';
import { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  label:    string;
  icon?:    string;
  onClick:  () => void;
  danger?:  boolean;
}

interface DropdownProps {
  trigger:  React.ReactNode;
  items:    DropdownItem[];
  align?:   'left' | 'right';
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          [align === 'right' ? 'right' : 'left']: 0,
          background: '#0F1E35',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 12,
          padding: '6px',
          minWidth: 180,
          zIndex: 100,
          boxShadow: '0 10px 30px rgba(0,0,0,.4)',
        }}>
          {items.map((item, i) => (
            <button key={i}
              onClick={() => { item.onClick(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 12px', borderRadius: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 500, textAlign: 'left',
                color: item.danger ? '#F87171' : '#F8FAFC',
                fontFamily: 'inherit', transition: 'background .1s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,.1)' : 'rgba(255,255,255,.06)')}
              onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
            >
              {item.icon && <span style={{ fontSize: 14 }}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}