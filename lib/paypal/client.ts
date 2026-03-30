import { PAYPAL_CONFIG } from './config';

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

// Crear suscripción en PayPal
export async function createPayPalSubscription(planId: string, returnUrl: string, cancelUrl: string) {
  const token = await getPayPalToken();
  const res   = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/subscriptions`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      plan_id:      planId,
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
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

// Obtener detalles de una suscripción
export async function getPayPalSubscription(subscriptionId: string) {
  const token = await getPayPalToken();
  const res   = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}