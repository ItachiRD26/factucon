'use client';

import { useEffect, useState } from 'react';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';

interface ApiKeyRow {
  id:         string;
  label:      string;
  prefix:     string;
  createdAt:  string | null;
  lastUsedAt: string | null;
  revoked:    boolean;
}

const CODE_STYLE: React.CSSProperties = {
  background:   'rgba(255,255,255,.04)',
  border:       '1px solid rgba(255,255,255,.07)',
  borderRadius: 9,
  padding:      '12px 14px',
  fontFamily:   'monospace',
  fontSize:     '0.72rem',
  color:        '#94A3B8',
  overflowX:    'auto',
  whiteSpace:   'pre',
  lineHeight:   1.6,
};

const SECTION_STYLE: React.CSSProperties = {
  background:   'rgba(255,255,255,.03)',
  border:       '1px solid rgba(255,255,255,.08)',
  borderRadius: 14,
  padding:      '18px 20px',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function DevelopersPage() {
  const { session, loading } = useSistemaSession();
  const [keys, setKeys]       = useState<ApiKeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [label, setLabel]     = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey]   = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState('');

  const color   = session?.primaryColor ?? '#0EA5E9';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  function load() {
    if (!session?.companyId) return;
    fetch(`/api/sistema/api-keys?companyId=${session.companyId}`)
      .then(r => r.json())
      .then(d => setKeys(d.keys ?? []))
      .finally(() => setLoadingKeys(false));
  }

  useEffect(() => { if (session) load(); }, [session]);

  async function handleCreate() {
    if (!session?.companyId || !label.trim() || creating) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/sistema/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: session.companyId, label: label.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Error al generar la clave');
      setNewKey(d.rawKey);
      setLabel('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar la clave');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string, keyLabel: string) {
    if (!session?.companyId) return;
    if (!window.confirm(`¿Revocar la clave "${keyLabel}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch('/api/sistema/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: session.companyId, keyId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Error al revocar la clave');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al revocar la clave');
    }
  }

  function handleCopy(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading || loadingKeys) {
    return (
      <SistemaLayout>
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)', fontSize: '0.85rem' }}>Cargando...</div>
      </SistemaLayout>
    );
  }

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>🔌 Desarrolladores</h1>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>
            Genera claves de API para integrar tus propios sistemas con Factucon
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* API Keys */}
          <div style={SECTION_STYLE}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 12 }}>Claves de API</h3>

            {newKey && (
              <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, marginBottom: 6 }}>
                  Clave generada — guárdala ahora, no se mostrará de nuevo
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{ ...CODE_STYLE, flex: 1, padding: '8px 10px' }}>{newKey}</code>
                  <button onClick={() => handleCopy(newKey)}
                    style={{ padding: '8px 12px', borderRadius: 8, background: color, color: '#fff', fontWeight: 700, fontSize: '0.72rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#F87171', fontSize: '0.75rem' }}>
                {error}
              </div>
            )}

            {keys.length > 0 && (
              <div style={{ border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 150px 150px 90px', padding: '8px 12px', background: 'rgba(255,255,255,.04)' }}>
                  {['Etiqueta', 'Clave', 'Creada', 'Último uso', ''].map(h => (
                    <div key={h} style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                  ))}
                </div>
                {keys.map((k, i) => (
                  <div key={k.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 150px 150px 90px', padding: '8px 12px', alignItems: 'center', borderTop: i > 0 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                    <div style={{ fontSize: '0.78rem', color: '#F8FAFC' }}>{k.label}</div>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'rgba(255,255,255,.4)' }}>{k.prefix}…</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.4)' }}>{fmtDate(k.createdAt)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.4)' }}>{fmtDate(k.lastUsedAt)}</div>
                    <div>
                      <button onClick={() => handleRevoke(k.id, k.label)}
                        style={{ fontSize: '0.68rem', fontWeight: 700, color: '#F87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
                        Revocar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Etiqueta (ej. Integración contable)"
                style={{ flex: 1, padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', color: '#F8FAFC', fontSize: '0.8rem', fontFamily: 'inherit' }} />
              <button onClick={handleCreate} disabled={creating || !label.trim()}
                style={{ padding: '9px 16px', borderRadius: 9, background: creating || !label.trim() ? 'rgba(255,255,255,.08)' : color, color: '#fff', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: creating || !label.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {creating ? 'Generando...' : 'Generar nueva clave'}
              </button>
            </div>
          </div>

          {/* Documentación */}
          <div style={SECTION_STYLE}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Documentación de la API</h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.5)', marginBottom: 14, lineHeight: 1.6 }}>
              Todas las peticiones a <code style={{ fontFamily: 'monospace', color: '#38BDF8' }}>/api/v1/*</code> requieren el
              encabezado <code style={{ fontFamily: 'monospace', color: '#38BDF8' }}>Authorization: Bearer &lt;tu-clave&gt;</code>.
              La empresa se determina automáticamente a partir de la clave — no se necesita enviar <code style={{ fontFamily: 'monospace', color: '#38BDF8' }}>companyId</code>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <DocEndpoint method="POST" path="/api/v1/sales" title="Crear una venta">
{`curl -X POST ${baseUrl}/api/v1/sales \\
  -H "Authorization: Bearer fc_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [
      { "productId": "abc123", "productName": "Producto X", "productCode": "P001", "qty": 2, "price": 500, "taxable": true }
    ],
    "subtotal": 1000,
    "tax": 180,
    "total": 1180,
    "paymentMethod": "cash",
    "customer": { "name": "Cliente de ejemplo", "rnc": "101123456" }
  }'

# Respuesta
{
  "ok": true,
  "saleId": "...",
  "saleNumber": "V-000123",
  "dgii": {
    "tipoECF": "E32",
    "eNCF": "E3200000001",
    "estado": "Aceptado",
    "trackId": "...",
    "urlQR": "https://ecf.dgii.gov.do/..."
  }
}
# "dgii" solo aparece si la empresa tiene e-CF habilitado; de lo contrario es null.`}
              </DocEndpoint>

              <DocEndpoint method="GET" path="/api/v1/sales" title="Listar ventas (paginado)">
{`curl "${baseUrl}/api/v1/sales?limit=20" \\
  -H "Authorization: Bearer fc_live_..."

# Respuesta
{ "sales": [ { "id": "...", "saleNumber": "V-000123", "total": 1180, "dgii": null, ... } ], "nextCursor": "..." }

# Para la siguiente página, agrega ?cursor=<nextCursor>`}
              </DocEndpoint>

              <DocEndpoint method="GET" path="/api/v1/sales/{id}" title="Detalle de una venta">
{`curl "${baseUrl}/api/v1/sales/abc123" \\
  -H "Authorization: Bearer fc_live_..."

# Respuesta
{ "sale": { "id": "abc123", "saleNumber": "V-000123", "items": [...], "total": 1180, "dgii": null } }`}
              </DocEndpoint>

              <DocEndpoint method="GET" path="/api/v1/clients" title="Listar clientes">
{`curl "${baseUrl}/api/v1/clients" \\
  -H "Authorization: Bearer fc_live_..."

# Respuesta
{ "clients": [ { "id": "...", "name": "Cliente de ejemplo", "rnc": "101123456", "subtipoFiscal": "regular", ... } ] }`}
              </DocEndpoint>

              <DocEndpoint method="POST" path="/api/v1/clients" title="Crear un cliente">
{`curl -X POST ${baseUrl}/api/v1/clients \\
  -H "Authorization: Bearer fc_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Cliente de ejemplo", "rnc": "101123456", "subtipoFiscal": "regular" }'

# Respuesta
{ "ok": true, "id": "..." }`}
              </DocEndpoint>

              <DocEndpoint method="GET" path="/api/v1/products" title="Listar productos (solo lectura)">
{`curl "${baseUrl}/api/v1/products" \\
  -H "Authorization: Bearer fc_live_..."

# Respuesta
{ "products": [ { "id": "...", "code": "P001", "name": "Producto X", "price": 500, "stock": 10, "taxable": true } ] }`}
              </DocEndpoint>
            </div>
          </div>

        </div>
      </div>
    </SistemaLayout>
  );
}

function DocEndpoint({ method, path, title, children }: {
  method:   'GET' | 'POST';
  path:     string;
  title:    string;
  children: string;
}) {
  const methodColor = method === 'GET' ? '#38BDF8' : '#34D399';
  return (
    <details style={{ border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, overflow: 'hidden' }}>
      <summary style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, listStyle: 'none' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: `${methodColor}1A`, color: methodColor, fontFamily: 'monospace' }}>{method}</span>
        <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#F8FAFC' }}>{path}</span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)' }}>— {title}</span>
      </summary>
      <div style={{ padding: '0 14px 14px' }}>
        <pre style={CODE_STYLE}>{children}</pre>
      </div>
    </details>
  );
}
