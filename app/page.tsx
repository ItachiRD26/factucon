import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Factucon — Sistema de Facturación Personalizable para RD',
  description: 'Crea tu propio sistema de facturación con NCF, ITBIS y e-CF DGII. Desde RD$800/mes. 14 días gratis.',
};

export default function HomePage() {
  return (
    <main style={{ background: '#060D1F', color: '#F8FAFC', fontFamily: 'var(--font-jakarta, sans-serif)', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '14px 0', borderBottom: '1px solid transparent',
        background: 'rgba(6,13,31,.85)', backdropFilter: 'blur(16px)',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(14,165,233,.4)', flexShrink: 0 }}>
              <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
              Factu<span style={{ color: '#0EA5E9' }}>con</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[['#como-funciona','¿Cómo funciona?'],['#plantillas','Plantillas'],['#precios','Precios']].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: '0.82rem', fontWeight: 500, color: '#94A3B8', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', transition: 'color .13s' }}>
                {label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/auth/login" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', padding: '8px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,.12)', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
            <Link href="/auth/register" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', padding: '9px 20px', borderRadius: 9, background: '#0EA5E9', textDecoration: 'none', boxShadow: '0 2px 12px rgba(14,165,233,.35)' }}>
              Crear cuenta →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 0 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, top: -200, left: -100, background: 'rgba(14,165,233,.06)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', width: 400, height: 400, bottom: -100, right: 100, background: 'rgba(139,92,246,.05)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }}/>

        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap' }}>

            {/* Left */}
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(14,165,233,.1)', border: '1px solid rgba(14,165,233,.25)', borderRadius: 99, padding: '5px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#0EA5E9', marginBottom: 28 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', display: 'inline-block' }}/>
                Nuevo · Facturación electrónica DGII incluida
              </div>

              <h1 style={{ fontSize: 'clamp(2.2rem,4.5vw,3.6rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 24 }}>
                Tu sistema de<br/>
                <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  facturación propio
                </span><br/>
                sin pagar fortuna
              </h1>

              <p style={{ fontSize: '1rem', color: '#94A3B8', lineHeight: 1.8, maxWidth: 500, marginBottom: 36 }}>
                Diseña el sistema de facturación ideal para tu negocio. Elige tu plantilla, activa los módulos que necesitas y en minutos tienes tu propio sistema — con NCF, ITBIS y e-CF DGII integrados.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
                <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, color: '#fff', padding: '13px 28px', borderRadius: 12, background: '#0EA5E9', textDecoration: 'none', boxShadow: '0 2px 16px rgba(14,165,233,.4)' }}>
                  Empezar gratis — 14 días →
                </Link>
                <a href="#como-funciona" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC', padding: '13px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)', textDecoration: 'none' }}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Ver demo
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                {[['10+','Plantillas de industria'],['100%','Compatible DGII'],['RD$800','Desde / mes']].map(([val, lbl]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 3 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mockup */}
            <div style={{ flexShrink: 0, width: '100%', maxWidth: 460, position: 'relative' }}>
              <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(15,30,53,.95)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 30px 80px rgba(0,0,0,.5)' }}>
                {/* Browser bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }}/>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }}/>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }}/>
                  <div style={{ flex: 1, margin: '0 10px', height: 22, borderRadius: 6, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', padding: '0 10px', fontFamily: 'monospace', fontSize: '0.62rem', color: '#475569' }}>
                    ferreteria.https://factucon.vercel.app//dashboard
                  </div>
                </div>
                {/* Content */}
                <div style={{ padding: '18px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569', marginBottom: 14 }}>
                    <span>Buenos días, Juan 👋</span>
                    <span style={{ color: '#10B981' }}>● Sistema activo</span>
                  </div>
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
                    {[['RD$48K','Ventas hoy','#0EA5E9'],['34','Facturas','#10B981'],['RD$8.6K','ITBIS 18%','#F59E0B']].map(([v,l,c]) => (
                      <div key={l} style={{ borderRadius: 10, padding: '10px 12px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: c as string, borderRadius: 0 }}/>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: c as string, lineHeight: 1 }}>{v}</div>
                        <div style={{ fontSize: '0.58rem', color: '#475569', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini table */}
                  <div style={{ borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px 65px', padding: '7px 12px', background: 'rgba(255,255,255,.04)', fontSize: '0.58rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                      <span>Comprobante</span><span>Cliente</span><span>Total</span><span>Estado</span>
                    </div>
                    {[['B01-0042','C. Méndez','RD$3,420','Pagado','green'],['B02-0041','Consumidor','RD$850','Pagado','green'],['B01-0040','Empresa XYZ','RD$12,600','Pendiente','yellow']].map(([ncf,client,total,status,color]) => (
                      <div key={ncf} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px 65px', padding: '9px 12px', fontSize: '0.7rem', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,.04)', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: 'rgba(14,165,233,.1)', color: '#0EA5E9', border: '1px solid rgba(14,165,233,.2)', borderRadius: 4, padding: '1px 5px', display: 'inline-block' }}>{ncf}</span>
                        <span>{client}</span>
                        <span style={{ fontWeight: 700, color: '#F8FAFC' }}>{total}</span>
                        <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: color === 'green' ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)', color: color === 'green' ? '#34D399' : '#FCD34D', display: 'inline-block' }}>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" style={{ padding: '100px 0', position: 'relative' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Tag>¿Cómo funciona?</Tag>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14 }}>
              De cero a facturando<br/>en menos de 10 minutos
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#94A3B8', lineHeight: 1.8, maxWidth: 480, margin: '0 auto' }}>
              Sin instalaciones, sin técnicos. Solo elige, configura y empieza.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 20 }}>
            {[
              ['1','🧩','Elige plantilla','Farmacia, taller, restaurante — la base ideal para tu negocio.'],
              ['2','⚙️','Personaliza módulos','POS, inventario, e-CF y más. Solo lo que necesitas.'],
              ['3','👥','Define usuarios','Cuántas PCs y qué rol tiene cada una. El precio se calcula solo.'],
              ['4','💳','Paga tu plan','Mensual por PayPal. Sin contratos, cancela cuando quieras.'],
              ['5','🚀','¡Listo!','Tu subdominio se crea solo. Abre el navegador y empieza.'],
            ].map(([num, icon, title, sub]) => (
              <div key={num} style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(14,165,233,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '0.85rem', fontWeight: 800, color: '#0EA5E9', background: 'rgba(14,165,233,.05)' }}>
                  {num}
                </div>
                <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{icon}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.65 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANTILLAS ── */}
      <section id="plantillas" style={{ padding: '100px 0', background: 'linear-gradient(180deg,transparent,rgba(14,165,233,.03),transparent)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Tag>Plantillas</Tag>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14 }}>
              Hecho para tu industria
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#94A3B8', lineHeight: 1.8, maxWidth: 480, margin: '0 auto' }}>
              Cada plantilla viene preconfigurada con los módulos que tu negocio necesita.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {[
              ['💊','Farmacia','Lote, vencimiento'],
              ['🔧','Taller','Órdenes, repuestos'],
              ['🍽️','Restaurante','Mesas, delivery'],
              ['🏪','Colmado','POS rápido, fiado'],
              ['🏥','Clínica','Pacientes, citas'],
              ['👗','Boutique','Tallas, colores'],
              ['🏗️','Ferretería','Inventario amplio'],
              ['📚','Librería','ISBN, editoriales'],
              ['💈','Salón','Servicios, citas'],
              ['⚙️','Personalizado','Desde cero'],
            ].map(([icon, name, sub]) => (
              <div key={name} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '20px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{icon}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: '0.68rem', color: '#475569' }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: '#fff', padding: '11px 24px', borderRadius: 11, background: '#0EA5E9', textDecoration: 'none', boxShadow: '0 2px 12px rgba(14,165,233,.3)' }}>
              Explorar todas las plantillas →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <Tag>Funcionalidades</Tag>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Todo lo que necesitas<br/>para facturar correctamente
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              ['🧾','Facturación electrónica DGII','NCF (B01, B02, B14, B16) y e-CF electrónico directo a la DGII.','rgba(14,165,233,.1)'],
              ['🛒','Punto de venta (POS)','Interfaz rápida para cajeros. Búsqueda por código, barcode o nombre.','rgba(16,185,129,.1)'],
              ['📦','Control de inventario','Stock en tiempo real, alertas de stock bajo, movimientos automáticos.','rgba(139,92,246,.1)'],
              ['📋','Cotizaciones','Genera presupuestos y conviértelos en factura con un clic.','rgba(245,158,11,.1)'],
              ['👥','CRM básico de clientes','Historial de compras, RNC, teléfono, crédito disponible.','rgba(212,83,126,.1)'],
              ['🤖','Asistente IA incluido','Pregúntale cualquier duda fiscal u operativa — en español.','rgba(14,165,233,.1)'],
              ['📈','Reportes y análisis','Ventas, ITBIS, top productos. Exporta formularios 606 y 607.','rgba(249,115,22,.1)'],
              ['💳','Cuentas por cobrar','Controla quién te debe y cuánto. Recordatorios automáticos.','rgba(16,185,129,.1)'],
              ['🏪','Módulo de compras','Registra compras a proveedores y actualiza inventario.','rgba(139,92,246,.1)'],
            ].map(([icon, title, sub, bg]) => (
              <div key={title as string} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: '26px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg as string, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: 16 }}>{icon}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.7 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <Tag>Precios</Tag>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14 }}>
              Paga solo por lo que usas
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#94A3B8', lineHeight: 1.8, maxWidth: 480, margin: '0 auto' }}>
              Precio base + módulos que actives + usuarios que necesites. Calculado en tiempo real en el wizard.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {[
              {
                name: 'Starter', price: 'RD$800', cycle: 'Base · 1 usuario',
                desc: 'Para pequeños negocios que necesitan facturar y llevar control básico.',
                features: ['POS (punto de venta)','Control de inventario','Cotizaciones','NCF B01, B02, B14','Reportes básicos','Asistente IA'],
                missing: ['e-CF DGII','CRM de clientes','Módulo de compras'],
                featured: false,
              },
              {
                name: 'Pro', price: 'RD$1,550', cycle: 'Base + e-CF + CRM · 3 usuarios',
                desc: 'Para negocios en crecimiento que necesitan facturación electrónica.',
                features: ['Todo el plan Starter','Facturación e-CF DGII','CRM básico de clientes','3 usuarios incluidos','Reportes 606 y 607','Soporte prioritario'],
                missing: ['Módulo de compras','Multi-almacén'],
                featured: true,
              },
              {
                name: 'Business', price: 'RD$2,450', cycle: 'Todo incluido · 10 usuarios',
                desc: 'La solución completa para empresas que necesitan todo el stack.',
                features: ['Todo el plan Pro','Módulo de compras','Cuentas por cobrar','Multi-almacén','10 usuarios incluidos','Soporte dedicado'],
                missing: [],
                featured: false,
              },
            ].map(plan => (
              <div key={plan.name} style={{
                background: plan.featured ? 'rgba(14,165,233,.04)' : 'rgba(255,255,255,.03)',
                border: plan.featured ? '1px solid #0EA5E9' : '1px solid rgba(255,255,255,.08)',
                borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden',
              }}>
                {plan.featured && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#0EA5E9,transparent)' }}/>
                )}
                {plan.featured && (
                  <div style={{ position: 'absolute', top: 18, right: 18, background: '#0EA5E9', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Más popular</div>
                )}
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 10 }}>{plan.name}</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1, marginBottom: 4 }}>
                  {plan.price}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#475569' }}>/mes</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: 20 }}>{plan.cycle}</div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.7, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: 18 }}>{plan.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.78rem', color: '#94A3B8' }}>
                      <svg width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.78rem', color: '#475569' }}>
                      <svg width="14" height="14" fill="none" stroke="#475569" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/auth/register" style={{
                  display: 'block', width: '100%', textAlign: 'center', padding: '11px', borderRadius: 11,
                  fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
                  background: plan.featured ? '#0EA5E9' : 'rgba(255,255,255,.07)',
                  color: '#fff',
                  boxShadow: plan.featured ? '0 2px 12px rgba(14,165,233,.3)' : 'none',
                  border: plan.featured ? 'none' : '1px solid rgba(255,255,255,.12)',
                }}>
                  Empezar gratis →
                </Link>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 560, margin: '28px auto 0', background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 16, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FCD34D', marginBottom: 6 }}>📌 Política de suscripción</div>
            <div style={{ fontSize: '0.73rem', color: '#475569', lineHeight: 1.8 }}>
              2 días de gracia si vence el pago. Datos siempre seguros. Más de 30 días inactivo requiere tarifa de reactivación de <strong style={{ color: '#94A3B8' }}>RD$500</strong>.
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '100px 0', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(14,165,233,.05)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }}/>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <Tag center>Empieza hoy</Tag>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.04em', margin: '20px 0 18px' }}>
            Deja de pagar de más por<br/>un sistema que no se adapta<br/>
            <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              a tu negocio
            </span>
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#94A3B8', lineHeight: 1.8, marginBottom: 36 }}>
            14 días gratis, sin tarjeta de crédito. Configura tu sistema en minutos.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, color: '#fff', padding: '14px 32px', borderRadius: 12, background: '#0EA5E9', textDecoration: 'none', boxShadow: '0 2px 20px rgba(14,165,233,.4)' }}>
              Crear mi sistema gratis →
            </Link>
            <a href="#como-funciona" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC', padding: '14px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)', textDecoration: 'none' }}>
              Ver cómo funciona
            </a>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#475569', marginTop: 16 }}>
            ✓ Sin tarjeta · ✓ Cancela cuando quieras · ✓ NCF y e-CF incluidos
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '48px 0 32px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Factu<span style={{ color: '#0EA5E9' }}>con</span></span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.75, maxWidth: 200 }}>
                Sistema de facturación personalizable para emprendedores dominicanos.
              </p>
            </div>
            {[
              ['Producto', ['¿Cómo funciona?','Plantillas','Funcionalidades','Precios']],
              ['Empresa',  ['Sobre nosotros','Blog','Contacto','Soporte']],
              ['Legal',    ['Términos de servicio','Política de privacidad','DGII']],
            ].map(([title, links]) => (
              <div key={title as string}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 14 }}>{title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(links as string[]).map(l => (
                    <a key={l} href="#" style={{ fontSize: '0.75rem', color: '#475569', textDecoration: 'none' }}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.07)', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: '0.7rem', color: '#475569' }}>© 2025 Factucon · Hecho con ❤️ para la República Dominicana</p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Términos','Privacidad','DGII'].map(l => (
                <a key={l} href="#" style={{ fontSize: '0.7rem', color: '#475569', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Tag({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(14,165,233,.08)', border: '1px solid rgba(14,165,233,.2)',
      borderRadius: 99, padding: '5px 14px', fontSize: '0.7rem', fontWeight: 700,
      color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.07em',
      marginBottom: 16, ...(center ? { margin: '0 auto 16px', display: 'flex', width: 'fit-content' } : {}),
    }}>
      {children}
    </div>
  );
}