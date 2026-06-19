// Tipos y reglas de negocio del núcleo e-CF (DGII República Dominicana)
// Portado/generalizado desde soraya-tours-ecf (sistema certificado 10/10 ante DGII)
// para uso multi-tenant: ninguna referencia a un negocio o RNC específico.

// ── Tipos de e-CF soportados ────────────────────────────────────────
export type TipoECF =
  | "E31" | "E32" | "E33" | "E34"
  | "E41" | "E43" | "E44" | "E45"
  | "E46" | "E47";

export const TIPOS_ECF: { codigo: TipoECF; label: string; soloB2B?: boolean }[] = [
  { codigo: "E31", label: "E31 — Crédito Fiscal Electrónico",       soloB2B: true  },
  { codigo: "E32", label: "E32 — Consumo Electrónico",              soloB2B: false },
  { codigo: "E33", label: "E33 — Nota de Débito Electrónica",       soloB2B: true  },
  { codigo: "E34", label: "E34 — Nota de Crédito Electrónica",      soloB2B: true  },
  { codigo: "E41", label: "E41 — Compras Electrónico",              soloB2B: true  },
  { codigo: "E43", label: "E43 — Gastos Menores Electrónico",       soloB2B: true  },
  { codigo: "E44", label: "E44 — Regímenes Especiales Electrónico", soloB2B: true  },
  { codigo: "E45", label: "E45 — Gubernamental Electrónico",        soloB2B: true  },
  { codigo: "E46", label: "E46 — Exportaciones Electrónico",        soloB2B: true  },
  { codigo: "E47", label: "E47 — Pagos al Exterior Electrónico",    soloB2B: true  },
];

// ── ITBIS ────────────────────────────────────────────────────────────
export const ITBIS_RATES = [
  { val: 0,    label: "Exento (E)" },
  { val: 0.16, label: "16%"        },
  { val: 0.18, label: "18%"        },
] as const;

export const TERMINOS_PAGO  = ["Contado", "Crédito"] as const;
export type TerminoPago = (typeof TERMINOS_PAGO)[number];

// ── Ambiente DGII ────────────────────────────────────────────────────
// "testecf" = Pruebas, "certecf" = Certificación, "ecf" = Producción
export type DgiiAmbiente = "testecf" | "certecf" | "ecf";

export const DGII_AMBIENTES: { value: DgiiAmbiente; label: string }[] = [
  { value: "testecf", label: "Pruebas (TesteCF)"        },
  { value: "certecf", label: "Certificación (CerteCF)"  },
  { value: "ecf",     label: "Producción"               },
];

// ── Cliente (datos fiscales relevantes para e-CF) ───────────────────
export type TipoPersona     = "fisica" | "juridica" | "consumidor";
export type SubtipoJuridica = "regular" | "gobierno" | "zona_franca" | "exportacion";

export interface ClienteFiscal {
  rnc?:      string;
  nombre:    string;
  direccion?: string;
  tipo:      TipoPersona;
  subtipo?:  SubtipoJuridica;
}

// ── Item de factura ──────────────────────────────────────────────────
// "por_unidad" (default): bruto = precio (unitario) × cantidad — venta normal.
// "por_grupo": bruto = precio (total plano del grupo) — usado por negocios que
//              cotizan un servicio completo independientemente de la cantidad
//              (ej. tours, paquetes). `cantidad` se usa solo para CantidadItem.
export type ModoLinea = "por_unidad" | "por_grupo";

export interface ItemFactura {
  codigo?:         string;
  descripcion:     string;
  modo:            ModoLinea;
  cantidad:        number;     // unidades, personas, horas, etc.
  precio:          number;     // precio unitario (por_unidad) o total del grupo (por_grupo)
  descuentoMonto:  number;     // RD$ de descuento sobre el bruto
  itbis:           number;     // 0 | 0.16 | 0.18
}

// ── Totales ───────────────────────────────────────────────────────────
export interface Totales {
  bruto: number;
  desc:  number;
  sub:   number;
  itbis: number;
  total: number;
}

// calcLinea(): devuelve itbisAmt (no "itbis") — regla documentada de soraya-tours-ecf.
export function calcLinea(item: ItemFactura) {
  const bruto    = item.modo === "por_grupo" ? item.precio : item.precio * (item.cantidad || 1);
  const descAmt  = Math.min(item.descuentoMonto || 0, bruto);
  const sub      = Math.max(0, bruto - descAmt);
  const itbisAmt = sub * (item.itbis || 0);
  return { bruto, descAmt, sub, itbisAmt, total: sub + itbisAmt };
}

export function calcTotales(items: ItemFactura[]): Totales {
  return items.reduce(
    (acc, item) => {
      const c = calcLinea(item);
      return {
        bruto: acc.bruto + c.bruto,
        desc:  acc.desc  + c.descAmt,
        sub:   acc.sub   + c.sub,
        itbis: acc.itbis + c.itbisAmt,
        total: acc.total + c.total,
      };
    },
    { bruto: 0, desc: 0, sub: 0, itbis: 0, total: 0 }
  );
}

// ── Datos del emisor (por tenant) ───────────────────────────────────
export interface EmpresaConfig {
  nombre:            string;
  rnc:               string;
  direccion:         string;
  telefono?:         string;
  actividadEconomica: string;  // requerido por XSD <ActividadEconomica> — varía por negocio
}

// ── Estado del documento ante DGII ──────────────────────────────────
export type EstadoDGII =
  | "pendiente" | "Enviado" | "Aceptado"
  | "AceptadoCondicional" | "Rechazado" | "Anulada" | "error";

// ── Factura / comprobante e-CF ──────────────────────────────────────
export interface Factura {
  id:                    string;
  idTransaccion?:        string;
  eCF:                   string;          // eNCF, ej. E310000000001
  tipoECF:               TipoECF;
  fecha:                 string;          // YYYY-MM-DD
  vencimientoECF:        string;          // YYYY-MM-DD — vence la secuencia autorizada
  terminos:              TerminoPago | string;

  // ── Comprador ──
  clienteId?:            string;
  nombreConsumidor?:     string;
  rncCompradorOcasional?: string;  // cédula (11) o RNC (9) — comprador ocasional E32 ≥ 250k
  esExtranjeroComprador?: boolean; // true → va en IdentificadorExtranjero

  // ── Notas de crédito/débito (E33/E34) ──
  eCFRef?:               string;   // eNCF modificado
  motivoNota?:           string;
  codigoModificacion?:   string;

  items:                 ItemFactura[];

  // ── Resultado del envío a DGII (se llena al emitir) ──
  estadoDGII?:           EstadoDGII;
  trackIdDGII?:          string;
  urlQR?:                string;
  xmlFirmado?:           string;
  signatureValue?:       string;
  codigoSeguridad?:      string;
  fechaEnvioDGII?:       string;
  fechaConsultaDGII?:    string;
  mensajesDGII?:         string[];
  fechaAnulacion?:       string;
}

// Factura antes de asignarle tipo/eNCF/vencimiento — los completa emitirECF().
export type FacturaSinECF = Omit<Factura, "tipoECF" | "eCF" | "vencimientoECF"> & {
  tipoECF?: TipoECF;
};

// ── Resolver tipo e-CF aplicable según el comprador ──────────────────
export interface ECFConfig {
  tipoDefault:      TipoECF;
  tiposDisponibles: TipoECF[];
  locked:           boolean;
  motivo:           string;
}

export function resolverECFConfig(
  cliente: Pick<ClienteFiscal, "tipo" | "subtipo" | "rnc"> | undefined,
  esWalkIn: boolean,
  esCompra = false,
): ECFConfig {
  // ── Modo Compra / Gasto ──────────────────────────────────────────
  if (esCompra) {
    if (esWalkIn || !cliente) {
      return {
        tipoDefault:      "E43",
        tiposDisponibles: ["E43", "E47"],
        locked:           false,
        motivo:           "Sin proveedor — E43 gasto menor / E47 pago al exterior",
      };
    }
    return {
      tipoDefault:      "E41",
      tiposDisponibles: ["E41"],
      locked:           true,
      motivo:           "Compra a proveedor local — E41",
    };
  }

  // ── Modo Venta ─────────────────────────────────────────────────────
  if (esWalkIn || !cliente) {
    return { tipoDefault: "E32", tiposDisponibles: ["E32"], locked: true, motivo: "Consumidor final — E32" };
  }
  if (cliente.tipo === "consumidor" || (cliente.tipo === "fisica" && !cliente.rnc?.trim())) {
    return { tipoDefault: "E32", tiposDisponibles: ["E32"], locked: true, motivo: "Consumidor — solo E32" };
  }
  if (cliente.tipo === "fisica") {
    return { tipoDefault: "E31", tiposDisponibles: ["E31", "E32"], locked: false, motivo: "Persona física con RNC — E31 o E32" };
  }
  const subtipo = cliente.subtipo ?? "regular";
  if (subtipo === "gobierno")    return { tipoDefault: "E45", tiposDisponibles: ["E45", "E31"], locked: false, motivo: "Entidad gubernamental — E45" };
  if (subtipo === "zona_franca") return { tipoDefault: "E44", tiposDisponibles: ["E44", "E31"], locked: false, motivo: "Régimen especial — E44" };
  if (subtipo === "exportacion") return { tipoDefault: "E46", tiposDisponibles: ["E46", "E31"], locked: false, motivo: "Exportación — E46" };
  return { tipoDefault: "E31", tiposDisponibles: ["E31"], locked: true, motivo: "Empresa — E31" };
}

// ── Helpers ────────────────────────────────────────────────────────
// eNCF = tipo (3 chars, ej. "E31") + secuencia (10 dígitos)
export const genECF = (tipo: TipoECF, seq: number) =>
  `${tipo}${String(seq).padStart(10, "0")}`;

export const localDate = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const today = () => localDate();
