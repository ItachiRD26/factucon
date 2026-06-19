import type { SubscriptionStatus } from '@/lib/types';

// true solo si la empresa ya completó al menos un cobro real (no solo trial).
// 'past_due' únicamente se alcanza desde 'active' (ver lib/subscriptions/block.ts y
// app/api/paypal/weebhook/route.ts), así que también cuenta como "ya pagó".
export function hasPaidPlan(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'past_due';
}
