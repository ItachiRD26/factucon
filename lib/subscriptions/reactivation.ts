import { updateSubscriptionStatus } from '@/lib/db/companies';
import { PRICING } from '@/lib/types';

export function getReactivationFee(): number {
  return PRICING.reactivationFee;
}

export async function reactivateCompany(companyId: string): Promise<void> {
  // Actualizar estado a active después de pagar la tarifa de reactivación
  await updateSubscriptionStatus(companyId, 'active');
}

export function needsReactivationFee(inactiveAt: Date | undefined): boolean {
  if (!inactiveAt) return false;
  const daysInactive = (Date.now() - inactiveAt.getTime()) / 86_400_000;
  return daysInactive > 30;
}