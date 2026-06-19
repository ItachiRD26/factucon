// Crea el producto y el plan base de PayPal usados por la app (un solo plan
// para todos los tenants; el precio de cada suscripción se sobreescribe por
// tenant en app/api/paypal/create-subscription/route.ts).
//
// Uso:
//   node --env-file=.env scripts/paypal-create-plan.mjs
//
// Requiere PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET y PAYPAL_MODE (sandbox|live)
// en .env. Al terminar, copia el "plan.id" impreso a PAYPAL_PLAN_ID en .env.
//
// PAYPAL_PRODUCT_ID (opcional): la app NO lo usa en runtime, solo este script.
// Si lo dejas vacío, este script crea un producto nuevo en el catálogo de
// PayPal e imprime su ID — guárdalo en .env como PAYPAL_PRODUCT_ID. Si vuelves
// a correr el script más adelante (p.ej. para crear otro plan con distinto
// trial/precio) y ya tienes ese valor, el script lo reutiliza en vez de crear
// un producto duplicado.

const PAYPAL_MODE = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
const BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET en el entorno.');
  console.error('Ejecuta: node --env-file=.env scripts/paypal-create-plan.mjs');
  process.exit(1);
}

console.log(`Modo PayPal: ${PAYPAL_MODE} (${BASE_URL})\n`);

async function getToken() {
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new Error(`Error obteniendo token de PayPal: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createProduct(token) {
  const res = await fetch(`${BASE_URL}/v1/catalogs/products`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name:        'Factucon - Sistema de Facturación',
      description: 'Suscripción mensual al sistema de facturación Factucon',
      type:        'SERVICE',
      category:    'SOFTWARE',
    }),
  });
  if (!res.ok) {
    throw new Error(`Error creando producto: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function createPlan(token, productId) {
  const res = await fetch(`${BASE_URL}/v1/billing/plans`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id:  productId,
      name:        'Factucon - Plan mensual',
      description: 'Plan mensual con 14 días de prueba gratis. El precio real se ajusta por tenant.',
      status:      'ACTIVE',
      billing_cycles: [
        {
          // Ciclo 1: 14 días de prueba gratis (no se cobra nada).
          frequency: { interval_unit: 'DAY', interval_count: 14 },
          tenure_type:    'TRIAL',
          sequence:       1,
          total_cycles:   1,
          pricing_scheme: { fixed_price: { value: '0', currency_code: 'USD' } },
        },
        {
          // Ciclo 2: mensual indefinido. El precio aquí es un placeholder —
          // create-subscription lo sobreescribe por tenant vía
          // plan.billing_cycles[{sequence:2, pricing_scheme...}].
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type:    'REGULAR',
          sequence:       2,
          total_cycles:   0,
          pricing_scheme: { fixed_price: { value: '20.00', currency_code: 'USD' } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding:     true,
        payment_failure_threshold: 3,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Error creando plan: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

try {
  const token = await getToken();

  let productId = process.env.PAYPAL_PRODUCT_ID;
  if (productId) {
    console.log(`Reutilizando producto existente: ${productId}`);
  } else {
    const product = await createProduct(token);
    productId = product.id;
    console.log(`Producto creado: ${productId}`);
  }

  const plan = await createPlan(token, productId);
  console.log(`Plan creado: ${plan.id}\n`);
  console.log('Copia estos valores a tu .env:');
  if (!process.env.PAYPAL_PRODUCT_ID) {
    console.log(`PAYPAL_PRODUCT_ID=${productId}  (opcional, solo para reutilizar en futuras corridas)`);
  }
  console.log(`PAYPAL_PLAN_ID=${plan.id}`);
} catch (err) {
  console.error(err.message ?? err);
  process.exit(1);
}
