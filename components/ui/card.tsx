import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ header, footer, children, style, ...props }: CardProps) {
  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, overflow: 'hidden', ...style }} {...props}>
      {header && <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)' }}>{header}</div>}
      <div style={{ padding: '18px' }}>{children}</div>
      {footer && <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.1)' }}>{footer}</div>}
    </div>
  );
}