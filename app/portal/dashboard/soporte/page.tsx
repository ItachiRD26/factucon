'use client';

export default function SoportePage() {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#F8FAFC',
            marginBottom: 4,
          }}
        >
          Soporte 💬
        </h1>

        <p
          style={{
            fontSize: '0.82rem',
            color: 'rgba(255,255,255,.35)',
          }}
        >
          Centro de ayuda y canales de contacto para tu cuenta de Factucon
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
          gap: 14,
          marginBottom: 18,
        }}
      >
        {[
          {
            icon: '📧',
            title: 'Correo de soporte',
            text: 'Recibe ayuda con facturación, acceso, errores del sistema o configuración.',
            action: 'soporte@facturacon.cfd',
          },
          {
            icon: '💬',
            title: 'Chat de asistencia',
            text: 'Habla con el equipo para resolver dudas rápidas sobre el uso del sistema.',
            action: 'Disponible próximamente',
          },
          {
            icon: '🧾',
            title: 'Ayuda de suscripción',
            text: 'Consultas sobre pagos, planes, bloqueos, reactivaciones y renovaciones.',
            action: 'Facturación y planes',
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>{item.icon}</div>
            <h2
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#F8FAFC',
                marginBottom: 8,
              }}
            >
              {item.title}
            </h2>
            <p
              style={{
                fontSize: '0.76rem',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,.42)',
                marginBottom: 12,
              }}
            >
              {item.text}
            </p>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#38BDF8',
              }}
            >
              {item.action}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'rgba(14,165,233,.07)',
          border: '1px solid rgba(14,165,233,.18)',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <h3
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#E0F2FE',
            marginBottom: 10,
          }}
        >
          Antes de contactar soporte
        </h3>

        <div
          style={{
            display: 'grid',
            gap: 8,
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,.55)',
            lineHeight: 1.7,
          }}
        >
          <div>• Verifica tu conexión y vuelve a cargar la página.</div>
          <div>• Confirma que tu suscripción esté activa.</div>
          <div>• Si hubo un error de pago, revisa la sección de facturación.</div>
          <div>• Ten a mano el nombre de la empresa o el correo de tu cuenta.</div>
        </div>
      </div>
    </div>
  );
}