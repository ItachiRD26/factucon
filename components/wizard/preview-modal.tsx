'use client';
import { WizardData } from './wizard-shell';
import { TEMPLATES } from '@/lib/types';
import { getUnitsForTemplate } from '@/lib/units';

interface Props {
  data:    WizardData;
  onClose: () => void;
}

// Ítems ficticios solo para la vista previa — no se guarda nada en la base de datos.
const MOCK_NAMES = ['Artículo de ejemplo A', 'Artículo de ejemplo B', 'Artículo de ejemplo C', 'Artículo de ejemplo D'];

export function PreviewModal({ data, onClose }: Props) {
  const template = TEMPLATES.find(t => t.id === data.templateId) ?? TEMPLATES.find(t => t.id === 'custom')!;
  const color    = data.primaryColor || template.color;
  const units    = getUnitsForTemplate(template.unitIds).slice(0, 4);
  const sellsServices = data.businessKind === 'servicios';

  const mockItems = MOCK_NAMES.map((name, i) => ({
    name,
    unit:  sellsServices ? 'servicio' : (units[i % units.length]?.id ?? 'unidad'),
    price: 250 + i * 175,
  }));

  const receiptItems = mockItems.slice(0, 2);
  const subtotal = receiptItems.reduce((s, it) => s + it.price, 0);
  const tax      = Math.round(subtotal * 0.18);
  const total     = subtotal + tax;

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#0B1424', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 70px rgba(0,0,0,.55)' }}>

        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0B1424' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>👁️ Vista previa de tu sistema</h3>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.4)' }}>Datos de ejemplo — nada de esto se guarda todavía</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          {/* Catálogo / POS mock */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              {sellsServices ? 'Catálogo de servicios' : `Punto de venta · ${template.productLabel.plural}`}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {mockItems.map(item => (
                <div key={item.name} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '12px 10px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#F8FAFC', marginBottom: 6, lineHeight: 1.3 }}>{item.name}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color }}>
                    RD${item.price}<span style={{ fontSize: '0.6rem', fontWeight: 500, color: 'rgba(255,255,255,.4)' }}>/{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comprobante de ejemplo */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 14px', color: '#111', fontFamily: 'monospace', fontSize: '0.72rem' }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{data.name || 'Tu Empresa'}</div>
              <div style={{ fontSize: '0.62rem', color: '#555' }}>RNC: {data.rnc || '1XX-XXXXX-X'}</div>
              <div style={{ fontSize: '0.62rem', color: '#555' }}>e-CF · {sellsServices ? 'B02' : 'B02'}00000001</div>
            </div>
            <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '8px 0', marginBottom: 8 }}>
              {receiptItems.map(it => (
                <div key={it.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{it.name}</span>
                  <span>RD${it.price}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>RD${subtotal}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ITBIS (18%)</span><span>RD${tax}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: 4, borderTop: '1px solid #999', paddingTop: 4 }}>
              <span>Total</span><span>RD${total}</span>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.58rem', color: '#777', marginTop: 10 }}>
              Vista previa — comprobante de ejemplo, no es un e-CF real
            </p>
          </div>
        </div>

        <div style={{ padding: '0 22px 20px' }}>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.7 }}>
            Así de simple se verá tu sistema una vez completes la certificación con la DGII. El
            comprobante real incluirá tu e-NCF, código QR y firma digital válidos.
          </p>
        </div>
      </div>
    </div>
  );
}
