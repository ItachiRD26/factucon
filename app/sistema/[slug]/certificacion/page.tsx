'use client';

import { useEffect, useState } from 'react';
import { useSistemaSession } from '@/app/sistema/hooks/use-sistema-session';
import { SistemaLayout } from '@/app/sistema/layout-component';
import { type TipoECF, type EstadoDGII, type DgiiAmbiente } from '@/lib/dgii/types';
import { hasPaidPlan } from '@/lib/subscriptions/gates';
import type { SubscriptionStatus } from '@/lib/types';

interface ResultadoCaso {
  eNCF:        string;
  tipoECF:     TipoECF;
  estado:      EstadoDGII;
  trackId?:    string;
  urlQR?:      string;
  error?:      string;
  paso:        boolean;
  ejecutadoAt: string;
}

interface CasoDisponible {
  eNCF:       string;
  tipoECF:    string;
  nombreItem: string;
  montoTotal: number;
}

interface CertData {
  dgiiConfig: {
    enabled:                   boolean;
    ambiente:                  DgiiAmbiente;
    certificadoCargado:        boolean;
    rnc:                       string;
    actividadEconomica:        string;
    certificacionConfirmadaAt: string | null;
  };
  certificacion: {
    casos:    Record<string, ResultadoCaso>;
    progreso: { total: number; completados: number; pasados: number };
  };
  casosDisponibles: CasoDisponible[];
  subscriptionStatus: SubscriptionStatus;
}

const ESTADO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:           { label: 'Pendiente',          color: '#94A3B8', bg: 'rgba(148,163,184,.1)' },
  Enviado:             { label: 'Enviado',            color: '#38BDF8', bg: 'rgba(14,165,233,.1)'  },
  Aceptado:            { label: 'Aceptado',           color: '#34D399', bg: 'rgba(16,185,129,.1)'  },
  AceptadoCondicional: { label: 'Acept. condicional', color: '#FBBF24', bg: 'rgba(245,158,11,.1)'  },
  Rechazado:           { label: 'Rechazado',          color: '#F87171', bg: 'rgba(239,68,68,.1)'   },
  Anulada:             { label: 'Anulada',            color: '#94A3B8', bg: 'rgba(148,163,184,.1)' },
  error:               { label: 'Error',              color: '#F87171', bg: 'rgba(239,68,68,.1)'   },
};

const STATUS_ICON: Record<string, string> = {
  done:     '✅',
  warn:     '⚠️',
  info:     'ℹ️',
  locked:   '🔒',
  progress: '⏳',
  ready:    '👉',
};

const TEXT_STYLE: React.CSSProperties = { fontSize: '0.78rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.6, marginBottom: 10 };
const LIST_STYLE: React.CSSProperties = { fontSize: '0.78rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.8, marginBottom: 10, paddingLeft: 18 };
const LINK_STYLE: React.CSSProperties = { fontSize: '0.78rem', color: '#38BDF8', textDecoration: 'underline' };

export default function CertificacionPage() {
  const { session, loading } = useSistemaSession();
  const [data, setData]               = useState<CertData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [running, setRunning]         = useState(false);
  const [currentCaso, setCurrentCaso] = useState<string | null>(null);
  const [advancing, setAdvancing]     = useState(false);
  const [advanceError, setAdvanceError] = useState('');

  const color = session?.primaryColor ?? '#0EA5E9';

  function load() {
    if (!session?.companyId) return;
    fetch(`/api/sistema/dgii/certificacion?companyId=${session.companyId}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoadingData(false));
  }

  useEffect(() => { if (session) load(); }, [session]);

  async function ejecutarCaso(eNCF: string): Promise<ResultadoCaso> {
    if (!session?.companyId) throw new Error('Sesión inválida');
    const res = await fetch('/api/sistema/dgii/certificacion/ejecutar-caso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: session.companyId, casoId: eNCF }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? 'Error al ejecutar el caso');
    return d.resultado as ResultadoCaso;
  }

  function applyResultado(eNCF: string, resultado: ResultadoCaso) {
    setData(prev => prev ? {
      ...prev,
      certificacion: {
        ...prev.certificacion,
        casos: { ...prev.certificacion.casos, [eNCF]: resultado },
      },
    } : prev);
  }

  async function handleRunOne(eNCF: string) {
    if (!data || running) return;
    setRunning(true);
    setCurrentCaso(eNCF);
    try {
      const resultado = await ejecutarCaso(eNCF);
      applyResultado(eNCF, resultado);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al ejecutar el caso');
    } finally {
      setRunning(false);
      setCurrentCaso(null);
      load();
    }
  }

  async function handleRunAllPending() {
    if (!data || running) return;
    setRunning(true);
    try {
      const pendientes = data.casosDisponibles.filter(c => !data.certificacion.casos[c.eNCF]?.paso);
      for (const caso of pendientes) {
        setCurrentCaso(caso.eNCF);
        try {
          const resultado = await ejecutarCaso(caso.eNCF);
          applyResultado(caso.eNCF, resultado);
        } catch {
          // continúa con el siguiente caso aunque uno falle
        }
      }
    } finally {
      setCurrentCaso(null);
      setRunning(false);
      load();
    }
  }

  async function handleAvanzar(nuevoAmbiente: 'certecf' | 'ecf') {
    if (!session?.companyId) return;
    setAdvancing(true);
    setAdvanceError('');
    try {
      const res = await fetch('/api/sistema/dgii/certificacion/avanzar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: session.companyId, ambiente: nuevoAmbiente }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Error al avanzar de ambiente');
      load();
    } catch (e) {
      setAdvanceError(e instanceof Error ? e.message : 'Error al avanzar de ambiente');
    } finally {
      setAdvancing(false);
    }
  }

  if (loading || loadingData || !data) {
    return (
      <SistemaLayout>
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)', fontSize: '0.85rem' }}>Cargando...</div>
      </SistemaLayout>
    );
  }

  const cfg       = data.dgiiConfig;
  const progreso  = data.certificacion.progreso;
  const allPassed = progreso.total > 0 && progreso.pasados === progreso.total;
  const datosFiscalesOk = !!cfg.rnc.trim() && !!cfg.actividadEconomica.trim();
  const canCertify = hasPaidPlan(data.subscriptionStatus);

  return (
    <SistemaLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>🏛️ Certificación DGII</h1>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.35)' }}>
            Guía paso a paso para certificar la facturación electrónica (e-CF) ante la DGII
          </p>
        </div>

        {!canCertify && (
          <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FCD34D', marginBottom: 6 }}>🔒 Necesitas tu plan activo para certificarte</h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.7, marginBottom: 12 }}>
              Certificarte ante la DGII tiene un costo operativo, por eso está disponible solo con el plan
              pagado. El resto del sistema (POS, inventario, etc.) sigue disponible libremente durante tu
              período de prueba.
            </p>
            <a href={`/portal/dashboard/empresa/${session?.companyId}/facturacion`} style={LINK_STYLE}>
              Activar mi plan →
            </a>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <StepCard n={1} title="Requisitos" status={datosFiscalesOk ? 'done' : 'warn'} color={color}>
            <ul style={LIST_STYLE}>
              <li>RNC activo y al día con la DGII</li>
              <li>Representante legal con firma digital (token o certificado .p12) vigente</li>
              <li>Datos fiscales completos en Factucon: RNC y actividad económica</li>
            </ul>
            {!datosFiscalesOk && (
              <Banner type="warn">
                Faltan datos fiscales. Complétalos en la configuración DGII de tu empresa (paso 4).
              </Banner>
            )}
          </StepCard>

          <StepCard n={2} title="Solicitud en la Oficina Virtual DGII" status="info" color={color}>
            <p style={TEXT_STYLE}>
              Ingresa a la Oficina Virtual de la DGII y solicita tu autorización como emisor de
              e-CF. La DGII te asignará un ambiente de pruebas (TestECF) con las secuencias
              autorizadas para cada tipo de comprobante electrónico.
            </p>
            <a href="https://www.dgii.gov.do" target="_blank" rel="noreferrer" style={LINK_STYLE}>
              Ir a dgii.gov.do →
            </a>
          </StepCard>

          <StepCard n={3} title="Firma digital y verificación de datos" status="info" color={color}>
            <p style={TEXT_STYLE}>
              La firma digital es un certificado <strong style={{ color: '#F8FAFC' }}>.p12</strong>{' '}
              (también llamado &quot;token&quot; o &quot;e-cédula&quot;) que prueba legalmente quién emite cada
              comprobante. No la emite Factucon ni la DGII directamente — se tramita ante una{' '}
              <strong style={{ color: '#F8FAFC' }}>entidad certificadora autorizada</strong> (ej.
              CamerFirma, INDOTEL lista las autorizadas). Pasos generales:
            </p>
            <ul style={LIST_STYLE}>
              <li>Solicita el certificado de firma digital con tus datos personales o de la empresa
                ante una entidad certificadora autorizada — usualmente toma entre 1 y 5 días.</li>
              <li>Al recibirlo, descarga el archivo <strong style={{ color: '#F8FAFC' }}>.p12</strong>{' '}
                y guarda bien su contraseña — la necesitarás para cargarlo en el paso 4.</li>
              <li><strong style={{ color: '#FCD34D' }}>Crítico:</strong> el nombre completo del
                titular de la firma debe coincidir EXACTAMENTE con el nombre del representante
                legal registrado en la Oficina Virtual de la DGII para tu RNC — si no coincide, la
                DGII rechaza la solicitud de facturador electrónico.</li>
              <li>Verifica que tu certificado .p12 corresponda al RNC autorizado por la DGII.</li>
              <li>Confirma que la actividad económica registrada coincida con la de la DGII.</li>
              <li>Registra las fechas de vencimiento de las secuencias autorizadas para cada tipo de
                e-CF (te las da la DGII al aprobar tu solicitud).</li>
            </ul>
            <Banner type="warn">
              Si tu certificado vence o el nombre no coincide, deberás tramitar uno nuevo — verifica
              esto ANTES de avanzar a las pruebas TestECF (paso 5) para no perder tiempo.
            </Banner>
          </StepCard>

          <StepCard n={4} title="Certificado digital (.p12)" status={cfg.certificadoCargado ? 'done' : 'warn'} color={color}>
            {cfg.certificadoCargado ? (
              <Banner type="success">Certificado cargado y configurado correctamente.</Banner>
            ) : (
              <>
                <Banner type="warn">Aún no has cargado tu certificado .p12.</Banner>
                <a href={`/portal/dashboard/empresa/${session?.companyId}/dgii`} style={LINK_STYLE}>
                  Ir a configuración DGII →
                </a>
              </>
            )}
          </StepCard>

          <StepCard n={5} title="Pruebas TestECF"
            status={!canCertify ? 'locked' : !cfg.certificadoCargado ? 'locked' : allPassed ? 'done' : 'progress'} color={color}>
            {!canCertify ? (
              <Banner type="warn">Activa tu plan (ver aviso arriba) para poder ejecutar las pruebas.</Banner>
            ) : !cfg.certificadoCargado ? (
              <Banner type="warn">Carga tu certificado .p12 (paso 4) para poder ejecutar las pruebas.</Banner>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>
                    <span>Progreso</span>
                    <span>{progreso.pasados} / {progreso.total} casos aprobados</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: color, width: `${progreso.total ? (progreso.pasados / progreso.total) * 100 : 0}%`, transition: 'width .2s' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <button onClick={handleRunAllPending} disabled={running || allPassed}
                    style={{ padding: '8px 16px', borderRadius: 9, background: running || allPassed ? 'rgba(255,255,255,.08)' : color, color: '#fff', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: running || allPassed ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {running ? `Ejecutando ${currentCaso ?? '...'}` : allPassed ? '✅ Todos los casos aprobados' : 'Ejecutar casos pendientes'}
                  </button>
                </div>

                <div style={{ border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px 130px 90px', padding: '8px 12px', background: 'rgba(255,255,255,.04)' }}>
                    {['eNCF', 'Concepto', 'Tipo', 'Estado', ''].map(h => (
                      <div key={h} style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                    ))}
                  </div>
                  {data.casosDisponibles.map((caso, i) => {
                    const r = data.certificacion.casos[caso.eNCF];
                    const estado = ESTADO_LABELS[r?.estado ?? 'pendiente'] ?? ESTADO_LABELS.pendiente;
                    return (
                      <div key={caso.eNCF} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px 130px 90px', padding: '8px 12px', alignItems: 'center', borderTop: i > 0 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                        <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#F8FAFC' }}>{caso.eNCF}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caso.nombreItem}</div>
                        <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(255,255,255,.4)' }}>E{caso.tipoECF}</div>
                        <div>
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: r ? estado.bg : 'rgba(255,255,255,.06)', color: r ? estado.color : 'rgba(255,255,255,.3)' }}>
                            {r ? estado.label : '—'}
                          </span>
                        </div>
                        <div>
                          {!r?.paso && (
                            <button onClick={() => handleRunOne(caso.eNCF)} disabled={running}
                              style={{ fontSize: '0.62rem', fontWeight: 700, color: '#38BDF8', background: 'none', border: 'none', cursor: running ? 'default' : 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
                              {running && currentCaso === caso.eNCF ? '...' : r ? 'Reintentar' : 'Ejecutar'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {Object.values(data.certificacion.casos).some(c => c.error) && (
                  <div style={{ marginTop: 10 }}>
                    {Object.values(data.certificacion.casos).filter(c => c.error).map(c => (
                      <div key={c.eNCF} style={{ fontSize: '0.68rem', color: '#F87171', marginBottom: 2 }}>
                        {c.eNCF}: {c.error}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </StepCard>

          <StepCard n={6} title="Avanzar a CertECF"
            status={cfg.ambiente !== 'testecf' ? 'done' : allPassed ? 'ready' : 'locked'} color={color}>
            {cfg.ambiente !== 'testecf' ? (
              <Banner type="success">
                Ambiente actual: {cfg.ambiente === 'certecf' ? 'CertECF (Certificación)' : 'Producción'}.
              </Banner>
            ) : !allPassed ? (
              <Banner type="warn">Aprueba todos los casos de TestECF (paso 5) antes de continuar.</Banner>
            ) : (
              <>
                <p style={TEXT_STYLE}>
                  Una vez la DGII revise y apruebe tus pruebas de TestECF, te notificará el cambio
                  a ambiente de Certificación (CertECF). Confirma aquí cuando recibas esa
                  aprobación.
                </p>
                <button onClick={() => handleAvanzar('certecf')} disabled={advancing}
                  style={{ padding: '8px 16px', borderRadius: 9, background: advancing ? 'rgba(255,255,255,.08)' : color, color: '#fff', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: advancing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {advancing ? 'Confirmando...' : 'Confirmar aprobación y avanzar a CertECF'}
                </button>
              </>
            )}
          </StepCard>

          <StepCard n={7} title="Producción"
            status={cfg.ambiente === 'ecf' ? 'done' : cfg.ambiente === 'certecf' ? 'ready' : 'locked'} color={color}>
            {cfg.ambiente === 'ecf' ? (
              <Banner type="success">🎉 ¡Tu empresa está certificada y emitiendo e-CF en producción!</Banner>
            ) : cfg.ambiente !== 'certecf' ? (
              <Banner type="warn">Completa el paso 6 (CertECF) antes de continuar.</Banner>
            ) : (
              <>
                <p style={TEXT_STYLE}>
                  Cuando la DGII apruebe tus pruebas en ambiente de Certificación (CertECF),
                  confirma aquí el paso final a producción. A partir de ese momento, tus e-CF
                  tendrán validez fiscal real.
                </p>
                <button onClick={() => handleAvanzar('ecf')} disabled={advancing}
                  style={{ padding: '8px 16px', borderRadius: 9, background: advancing ? 'rgba(255,255,255,.08)' : color, color: '#fff', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: advancing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {advancing ? 'Confirmando...' : 'Confirmar aprobación y avanzar a Producción'}
                </button>
              </>
            )}
          </StepCard>

          {advanceError && <Banner type="error">{advanceError}</Banner>}
        </div>
      </div>
    </SistemaLayout>
  );
}

function StepCard({ n, title, status, color, children }: {
  n: number;
  title: string;
  status: keyof typeof STATUS_ICON;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
          {n}
        </div>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC', flex: 1 }}>{title}</h3>
        <span style={{ fontSize: '1rem' }}>{STATUS_ICON[status]}</span>
      </div>
      {children}
    </div>
  );
}

function Banner({ type, children }: { type: 'error' | 'success' | 'warn'; children: React.ReactNode }) {
  const palette = {
    error:   { bg: 'rgba(239,68,68,.08)',  border: 'rgba(239,68,68,.2)',  color: '#F87171' },
    success: { bg: 'rgba(16,185,129,.08)', border: 'rgba(16,185,129,.2)', color: '#34D399' },
    warn:    { bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)', color: '#FBBF24' },
  }[type];
  return (
    <div style={{ padding: '9px 12px', borderRadius: 9, fontSize: '0.78rem', background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color, marginBottom: 10 }}>
      {children}
    </div>
  );
}
