import { PAYPAL_CONFIG } from './config';
import { getPayPalToken } from './client';

export async function verifyPayPalWebhook(
  headers: Record<string, string>,
  body:    string
): Promise<boolean> {
  try {
    const token = await getPayPalToken();
    const res   = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        webhook_id:               PAYPAL_CONFIG.webhookId,
        webhook_event:            JSON.parse(body),
        cert_url:                 headers['paypal-cert-url'],
        auth_algo:                headers['paypal-auth-algo'],
        transmission_id:          headers['paypal-transmission-id'],
        transmission_time:        headers['paypal-transmission-time'],
        transmission_sig:         headers['paypal-transmission-sig'],
      }),
    });

    const data = await res.json();
    return data.verification_status === 'SUCCESS';
  } catch {
    return false;
  }
}