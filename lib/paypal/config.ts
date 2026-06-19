// "sandbox" o "live" — independiente de NODE_ENV. Esto permite probar PayPal
// en modo sandbox aunque la app esté desplegada en producción: solo se cambia
// esta variable de entorno, sin redeploy de código.
export const PAYPAL_MODE: 'sandbox' | 'live' =
  process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';

export const PAYPAL_CONFIG = {
  clientId:     process.env.PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  webhookId:    process.env.PAYPAL_WEBHOOK_ID!,
  baseUrl:      PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com',
};

// ID del plan base de PayPal (un solo plan para todos los tenants; el precio
// de cada suscripción se sobreescribe por tenant, ver lib/paypal/client.ts).
// Se genera con: node --env-file=.env scripts/paypal-create-plan.mjs
export const PAYPAL_PLAN_ID = process.env.PAYPAL_PLAN_ID ?? '';

// PayPal no soporta cobros en pesos dominicanos (DOP) — solo monedas como USD.
// La app sigue mostrando RD$ en todas partes (wizard, home, dashboard); para
// crear la suscripción en PayPal se usa el equivalente en USD calculado con
// esta tasa configurable (ej. 60 → RD$60 = US$1).
export const DOP_USD_RATE = Number(process.env.NEXT_PUBLIC_PAYPAL_DOP_USD_RATE ?? '60');

export function dopToUsd(amountDOP: number): string {
  return (amountDOP / DOP_USD_RATE).toFixed(2);
}
