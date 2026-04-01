import { ModuleId, PRICING, calculatePrice } from '@/lib/types';

export { calculatePrice };

export interface PricingBreakdown {
  base:       number;
  extraUsers: number;
  modules:    { id: ModuleId; price: number }[];
  total:      number;
}

export function getPricingBreakdown(modules: ModuleId[], users: number): PricingBreakdown {
  const extraUsers  = Math.max(0, users - 1) * PRICING.pricePerUser;
  const modulesList = modules
    .map(id => ({ id, price: PRICING.modulesPricing[id] ?? 0 }))
    .filter(m => m.price > 0);

  return {
    base:       PRICING.basePrice,
    extraUsers,
    modules:    modulesList,
    total:      calculatePrice(modules, users),
  };
}

export function getReactivationFee(): number {
  return PRICING.reactivationFee;
}