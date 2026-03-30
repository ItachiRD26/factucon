// ── Roles ────────────────────────────────────────────────────
export type UserRole = 'superadmin' | 'owner' | 'admin' | 'cashier';

// ── Suscripción ──────────────────────────────────────────────
export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'   // pago fallido / retrasado
  | 'blocked'    // +2 días sin pagar → sistema bloqueado
  | 'inactive'   // +30 días → requiere tarifa de reactivación
  | 'canceled';

// ── Plantillas de industria ──────────────────────────────────
export type TemplateId =
  | 'pharmacy'
  | 'workshop'
  | 'restaurant'
  | 'grocery'
  | 'clinic'
  | 'boutique'
  | 'hardware'
  | 'bookstore'
  | 'salon'
  | 'custom';

// ── Módulos disponibles ──────────────────────────────────────
export type ModuleId =
  | 'pos'
  | 'inventory'
  | 'quotes'
  | 'ecf'           // Facturación electrónica DGII
  | 'clients'       // CRM básico
  | 'purchases'     // Compras / proveedores
  | 'reports'
  | 'accounts_receivable'
  | 'multi_warehouse';

// ── Usuario (cuenta personal en https://factucon.vercel.app/) ─────────────────
export interface PortalUser {
  uid:         string;
  email:       string;
  displayName: string;
  phone?:      string;
  avatarUrl?:  string;
  createdAt:   Date;
  updatedAt:   Date;
}

// ── Código de activación por PC ──────────────────────────────
export interface ActivationCode {
  code:        string;       // FC-2025-A1B2-OWNER
  companyId:   string;
  role:        UserRole;
  label:       string;       // "Caja 1", "Admin oficina", etc.
  isActive:    boolean;
  lastUsedAt?: Date;
  deviceInfo?: string;
  createdAt:   Date;
}

// ── Empresa / Sistema de facturación ─────────────────────────
export interface Company {
  id:          string;
  ownerId:     string;       // uid del PortalUser
  name:        string;
  slug:        string;       // subdominio: ferreteria → ferreteria.https://factucon.vercel.app/
  rnc?:        string;
  phone?:      string;
  address?:    string;
  email?:      string;
  logoUrl?:    string;
  primaryColor: string;      // color de marca elegido en wizard

  // Plantilla e industria
  templateId:  TemplateId;

  // Módulos activos
  modules:     ModuleId[];

  // Usuarios / códigos de activación
  maxUsers:    number;
  codes:       ActivationCode[];

  // Fiscal RD
  ncfConfig?: {
    enabled: boolean;
    sequences: {
      B01?: { current: number; limit: number };
      B02?: { current: number; limit: number };
      B14?: { current: number; limit: number };
      B15?: { current: number; limit: number };
      B16?: { current: number; limit: number };
    };
  };

  // Configuración general
  settings: {
    currency:  string;       // DOP por defecto
    timezone:  string;       // America/Santo_Domingo
    taxRate:   number;       // 18 (ITBIS)
    language:  string;       // es
  };

  // Suscripción
  subscription: {
    status:              SubscriptionStatus;
    planPrice:           number;           // precio calculado en wizard
    paypalSubscriptionId?: string;
    currentPeriodStart:  Date;
    currentPeriodEnd:    Date;
    trialEndsAt?:        Date;
    blockedAt?:          Date;
    inactiveAt?:         Date;
    reactivationFee:     number;           // tarifa si lleva +30 días inactivo
  };

  // Subdominio Vercel
  subdomain?: {
    provisioned:  boolean;
    provisionedAt?: Date;
    vercelDomainId?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

// ── Precios base (calculadora del wizard) ────────────────────
export interface PricingConfig {
  basePrice:        number;   // precio base mensual
  pricePerUser:     number;   // por usuario adicional (después del 1ro)
  modulesPricing: Record<ModuleId, number>;
  reactivationFee:  number;   // tarifa por reactivar +30 días inactivo
}

export const PRICING: PricingConfig = {
  basePrice:    800,          // RD$800/mes base (incluye 1 usuario)
  pricePerUser: 150,          // RD$150 por usuario extra
  modulesPricing: {
    pos:                  0,  // incluido en base
    inventory:            0,  // incluido en base
    quotes:               0,  // incluido en base
    reports:              0,  // incluido en base
    ecf:                300,  // +RD$300 facturación electrónica DGII
    clients:            150,  // +RD$150 CRM básico
    purchases:          200,  // +RD$200 módulo compras
    accounts_receivable:200,  // +RD$200 cuentas por cobrar
    multi_warehouse:    300,  // +RD$300 multi almacén
  },
  reactivationFee: 500,       // RD$500 tarifa de reactivación
};

// ── Función: calcular precio ─────────────────────────────────
export function calculatePrice(modules: ModuleId[], users: number): number {
  const base     = PRICING.basePrice;
  const extraUsers = Math.max(0, users - 1) * PRICING.pricePerUser;
  const moduleCost = modules.reduce(
    (sum, m) => sum + (PRICING.modulesPricing[m] ?? 0), 0
  );
  return base + extraUsers + moduleCost;
}

// ── Templates de industria ───────────────────────────────────
export interface Template {
  id:              TemplateId;
  name:            string;
  description:     string;
  icon:            string;
  defaultModules:  ModuleId[];
  color:           string;
}

export const TEMPLATES: Template[] = [
  { id: 'pharmacy',   name: 'Farmacia',      icon: '💊', color: '#10B981', description: 'Lote, vencimiento, INVIMA',        defaultModules: ['pos','inventory','clients','reports'] },
  { id: 'workshop',   name: 'Taller',        icon: '🔧', color: '#F59E0B', description: 'Órdenes de trabajo, mecánicos',    defaultModules: ['pos','quotes','clients','reports'] },
  { id: 'restaurant', name: 'Restaurante',   icon: '🍽️', color: '#EF4444', description: 'Mesas, cocina, delivery',          defaultModules: ['pos','inventory','reports'] },
  { id: 'grocery',    name: 'Colmado',       icon: '🏪', color: '#8B5CF6', description: 'POS rápido, fiado, inventario',    defaultModules: ['pos','inventory','reports'] },
  { id: 'clinic',     name: 'Clínica',       icon: '🏥', color: '#0EA5E9', description: 'Pacientes, citas, NCF',            defaultModules: ['pos','clients','ecf','reports'] },
  { id: 'boutique',   name: 'Boutique',      icon: '👗', color: '#D4537E', description: 'Tallas, colores, temporadas',      defaultModules: ['pos','inventory','clients','reports'] },
  { id: 'hardware',   name: 'Ferretería',    icon: '🏗️', color: '#92400E', description: 'Inventario amplio, unidades',      defaultModules: ['pos','inventory','purchases','reports'] },
  { id: 'bookstore',  name: 'Librería',      icon: '📚', color: '#1D4ED8', description: 'ISBN, editoriales, consignación',  defaultModules: ['pos','inventory','reports'] },
  { id: 'salon',      name: 'Salón de belleza', icon: '💈', color: '#BE185D', description: 'Servicios, citas, comisiones', defaultModules: ['pos','clients','quotes','reports'] },
  { id: 'custom',     name: 'Personalizado', icon: '⚙️', color: '#6B7280', description: 'Configura desde cero',             defaultModules: ['pos','inventory'] },
];