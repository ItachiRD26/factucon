export const PAYPAL_CONFIG = {
  clientId:     process.env.PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  webhookId:    process.env.PAYPAL_WEBHOOK_ID!,
  baseUrl:      process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com',
};

// IDs de planes de PayPal (se crean en el dashboard de PayPal)
// En desarrollo usa sandbox, en prod cambia por los IDs reales
export const PAYPAL_PLANS = {
  starter:  process.env.PAYPAL_PLAN_STARTER  ?? 'P-STARTER',
  pro:      process.env.PAYPAL_PLAN_PRO      ?? 'P-PRO',
  business: process.env.PAYPAL_PLAN_BUSINESS ?? 'P-BUSINESS',
};