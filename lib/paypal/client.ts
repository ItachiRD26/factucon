import { PAYPAL_CONFIG, PAYPAL_PLAN_ID } from './config';

// Obtener access token de PayPal
export async function getPayPalToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error('Error obteniendo token de PayPal');
  const data = await res.json();
  return data.access_token;
}

// Crear suscripción en PayPal.
// Si se pasa priceUSD, sobreescribe el precio del ciclo regular (sequence 2)
// del plan base para esta suscripción específica — permite precio dinámico
// por tenant usando un solo plan de PayPal (ver scripts/paypal-create-plan.mjs).
export async function createPayPalSubscription(
  planId: string,
  returnUrl: string,
  cancelUrl: string,
  priceUSD?: string,
) {
  const token = await getPayPalToken();

  const body: Record<string, unknown> = {
    plan_id: planId,
    application_context: {
      brand_name:  'Factucon',
      return_url:  returnUrl,
      cancel_url:  cancelUrl,
      user_action: 'SUBSCRIBE_NOW',
    },
  };

  if (priceUSD) {
    body.plan = {
      billing_cycles: [
        {
          sequence: 2,
          pricing_scheme: {
            fixed_price: { value: priceUSD, currency_code: 'USD' },
          },
        },
      ],
    };
  }

  const res = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/subscriptions`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Error creando suscripción en PayPal');
  }
  return res.json();
}

// Cancelar suscripción en PayPal
export async function cancelPayPalSubscription(subscriptionId: string): Promise<void> {
  const token = await getPayPalToken();
  await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: 'Cancelado por el usuario' }),
  });
}

// Ajusta el precio del próximo ciclo de una suscripción activa — se usa para
// aplicar el cargo por excedente de comprobantes del ciclo que acaba de
// cerrar. Mismo mecanismo de override que createPayPalSubscription.
export async function revisePayPalSubscriptionPrice(subscriptionId: string, priceUSD: string): Promise<void> {
  const token = await getPayPalToken();
  const res = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/subscriptions/${subscriptionId}/revise`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      plan_id: PAYPAL_PLAN_ID,
      plan: {
        billing_cycles: [
          { sequence: 2, pricing_scheme: { fixed_price: { value: priceUSD, currency_code: 'USD' } } },
        ],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Error actualizando el precio de la suscripción en PayPal');
  }
}

// Obtener detalles de una suscripción
export async function getPayPalSubscription(subscriptionId: string) {
  const token = await getPayPalToken();
  const res   = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}