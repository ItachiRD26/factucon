import type { TipoECF, DgiiAmbiente } from '@/lib/dgii/types';

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

// ── Usuario (cuenta personal en facturacon.cfd) ─────────────────
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

// ── Configuración e-CF (DGII) por empresa ────────────────────
export interface DgiiConfig {
  enabled:            boolean;
  ambiente:           DgiiAmbiente;        // testecf | certecf | ecf
  rnc:                string;              // RNC certificado ante DGII
  actividadEconomica: string;              // requerido por XSD <ActividadEconomica>
  certificadoCargado: boolean;             // true si ya subió su .p12 (ver dgii_config/credenciales)
  // Fecha de vencimiento autorizada por DGII para cada secuencia (YYYY-MM-DD)
  vencimientos?: Partial<Record<TipoECF, string>>;
  // ISO de la última vez que el tenant confirmó un avance de ambiente (testecf→certecf→ecf)
  certificacionConfirmadaAt?: string;
}

// ── Empresa / Sistema de facturación ─────────────────────────
export interface Company {
  id:          string;
  ownerId:     string;       // uid del PortalUser
  name:        string;
  slug:        string;       // subdominio: ferreteria → ferreteria.facturacon.cfd
  rnc?:        string;
  phone?:      string;
  address?:    string;
  email?:      string;
  logoUrl?:    string;
  primaryColor: string;      // color de marca elegido en wizard

  // Plantilla e industria
  templateId:  TemplateId;
  businessKind: BusinessKind; // vende productos, servicios, o ambos — define los módulos automáticos

  // Módulos activos
  modules:     ModuleId[];

  // Usuarios / códigos de activación
  maxUsers:    number;
  codes:       ActivationCode[];

  // Fiscal RD — NCF (legado, solo para empresas no certificadas en e-CF)
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

  // Fiscal RD — e-CF (Comprobante Fiscal Electrónico DGII)
  // Reemplaza a ncfConfig para empresas certificadas. El .p12 y su contraseña
  // se guardan cifrados por separado en companies/{id}/dgii_config/credenciales
  // (ver lib/dgii/cert-crypto.ts) — nunca en este documento.
  dgiiConfig?: DgiiConfig;

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
    planId:              PlanId;           // tier asignado al provisionar, vía getPlanTier(planPrice)
    comprobanteLimit:    number;           // comprobantes incluidos por mes (según el tier)
    comprobantesUsed:    number;           // contador del ciclo actual, reinicia al renovar
    overageRate:         number;           // RD$ por comprobante extra (cargo en el ciclo siguiente)
    pendingOverageDOP:   number;           // excedente del último ciclo, ya aplicado al próximo cobro
    paypalSubscriptionId?: string;
    paypalStatus?:       string;           // estado crudo de PayPal: APPROVAL_PENDING, ACTIVE, etc.
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
  reactivationFee:  number;   // tarifa por reactivar +30 días inactivo
}

export const PRICING: PricingConfig = {
  basePrice:    800,          // RD$800/mes base (incluye 1 usuario)
  pricePerUser: 150,          // RD$150 por usuario extra
  reactivationFee: 500,       // RD$500 tarifa de reactivación
};

// ── Módulos automáticos según el negocio ──────────────────────
// El e-CF está estandarizado: todo negocio recibe el mismo núcleo fiscal. Lo
// único que varía es si necesita POS + inventario (vende productos) o no
// (solo servicios) — ya no se elige módulo por módulo en el wizard.
export type BusinessKind = 'productos' | 'servicios' | 'ambos';

const CORE_MODULES: ModuleId[]    = ['ecf', 'quotes', 'reports', 'clients', 'accounts_receivable'];
const PRODUCT_MODULES: ModuleId[] = ['pos', 'inventory', 'purchases', 'multi_warehouse'];

export function getModulesForBusiness(kind: BusinessKind): ModuleId[] {
  return kind === 'servicios' ? CORE_MODULES : [...CORE_MODULES, ...PRODUCT_MODULES];
}

// ── Planes por volumen de comprobantes ───────────────────────
// Cada plan incluye un límite de comprobantes (facturas/ventas) por mes. Si
// la empresa lo supera, cada comprobante extra genera un cargo (overageRate)
// que se aplica automáticamente al ciclo siguiente de PayPal. El cliente
// elige el plan directamente (no se calcula a partir de módulos).
export type PlanId = 'starter' | 'pro' | 'business' | 'enterprise';

export interface PlanTier {
  id:               PlanId;
  name:             string;
  price:            number;   // precio fijo (RD$/mes, incluye 1 usuario)
  maxPrice:         number;   // límite superior histórico — usado por getPlanTier()
  comprobanteLimit: number;   // comprobantes incluidos por mes
  overageRate:      number;   // RD$ por comprobante extra
}

export const PLAN_TIERS: PlanTier[] = [
  { id: 'starter',    name: 'Starter',    price: 800,  maxPrice: 1200,     comprobanteLimit: 500,  overageRate: 6 },
  { id: 'pro',        name: 'Pro',        price: 1550, maxPrice: 2200,     comprobanteLimit: 1000, overageRate: 5 },
  { id: 'business',   name: 'Business',   price: 2450, maxPrice: 3800,     comprobanteLimit: 3000, overageRate: 4 },
  { id: 'enterprise', name: 'Enterprise', price: 3800, maxPrice: Infinity, comprobanteLimit: 8000, overageRate: 3 },
];

export function getPlanTier(monthlyPrice: number): PlanTier {
  return PLAN_TIERS.find(t => monthlyPrice <= t.maxPrice) ?? PLAN_TIERS[PLAN_TIERS.length - 1];
}

// Precio mensual de un plan elegido directamente (wizard) + usuarios extra.
export function calculatePlanPrice(planId: PlanId, users: number): number {
  const tier = PLAN_TIERS.find(t => t.id === planId) ?? PLAN_TIERS[0];
  return tier.price + Math.max(0, users - 1) * PRICING.pricePerUser;
}

// ── Templates de industria ───────────────────────────────────
export interface Template {
  id:              TemplateId;
  name:            string;
  description:     string;
  icon:            string;
  color:           string;
  // Sugerencia por defecto de si este negocio vende productos, servicios o
  // ambos — el cliente puede confirmarlo/cambiarlo en el wizard.
  businessKind:    BusinessKind;
  // Cómo se le llama a un "producto" en este tipo de negocio (ej. "Medicamento"
  // en farmacia, "Plato" en restaurante) — usado en POS, inventario, productos.
  productLabel:    { singular: string; plural: string };
  // Subconjunto de ids de lib/units.ts relevante para este negocio. Vacío =
  // mostrar todas las unidades (caso de 'custom').
  unitIds:         string[];
}

export const TEMPLATES: Template[] = [
  { id: 'pharmacy',   name: 'Farmacia',      icon: '💊', color: '#10B981', description: 'Lote, vencimiento, INVIMA',        businessKind: 'productos',
    productLabel: { singular: 'Medicamento', plural: 'Medicamentos' }, unitIds: ['unidad','caja','paquete'] },
  { id: 'workshop',   name: 'Taller',        icon: '🔧', color: '#F59E0B', description: 'Órdenes de trabajo, mecánicos',    businessKind: 'servicios',
    productLabel: { singular: 'Servicio', plural: 'Servicios' }, unitIds: ['servicio','hora','unidad'] },
  { id: 'restaurant', name: 'Restaurante',   icon: '🍽️', color: '#EF4444', description: 'Mesas, cocina, delivery',          businessKind: 'ambos',
    productLabel: { singular: 'Plato', plural: 'Platos' }, unitIds: ['unidad','servicio','litro'] },
  { id: 'grocery',    name: 'Colmado',       icon: '🏪', color: '#8B5CF6', description: 'POS rápido, fiado, inventario',    businessKind: 'productos',
    productLabel: { singular: 'Producto', plural: 'Productos' }, unitIds: ['unidad','lb','kg','litro','galon','caja','paquete'] },
  { id: 'clinic',     name: 'Clínica',       icon: '🏥', color: '#0EA5E9', description: 'Pacientes, citas, NCF',            businessKind: 'servicios',
    productLabel: { singular: 'Servicio', plural: 'Servicios' }, unitIds: ['servicio','hora','unidad'] },
  { id: 'boutique',   name: 'Boutique',      icon: '👗', color: '#D4537E', description: 'Tallas, colores, temporadas',      businessKind: 'productos',
    productLabel: { singular: 'Prenda', plural: 'Prendas' }, unitIds: ['unidad','par','docena'] },
  { id: 'hardware',   name: 'Ferretería',    icon: '🏗️', color: '#92400E', description: 'Inventario amplio, unidades',      businessKind: 'ambos',
    productLabel: { singular: 'Material', plural: 'Materiales' }, unitIds: ['unidad','metro','pie','lb','kg','galon','litro','caja','rollo'] },
  { id: 'bookstore',  name: 'Librería',      icon: '📚', color: '#1D4ED8', description: 'ISBN, editoriales, consignación',  businessKind: 'productos',
    productLabel: { singular: 'Libro', plural: 'Libros' }, unitIds: ['unidad','docena','caja'] },
  { id: 'salon',      name: 'Salón de belleza', icon: '💈', color: '#BE185D', description: 'Servicios, citas, comisiones', businessKind: 'servicios',
    productLabel: { singular: 'Servicio', plural: 'Servicios' }, unitIds: ['servicio','hora'] },
  { id: 'custom',     name: 'Personalizado', icon: '⚙️', color: '#6B7280', description: 'Configura desde cero',             businessKind: 'ambos',
    productLabel: { singular: 'Producto', plural: 'Productos' }, unitIds: [] },
];