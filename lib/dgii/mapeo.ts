// Mapeo de ventas POS → modelo fiscal e-CF
//
// Convierte el payload genérico de una venta (items de carrito + cliente opcional)
// al `FacturaSinECF` + `ClienteFiscal` que consume `emisor.ts`. `emitirECF()` se
// encarga de resolver el TipoECF, asignar el eNCF y el vencimiento.

import {
  today,
  type ClienteFiscal, type FacturaSinECF, type ItemFactura,
  type ModoLinea, type TipoPersona, type SubtipoJuridica,
} from "./types";

// ── Clasificación fiscal del comprador a partir de su RNC/cédula ─────
// Sin documento → consumidor final. Cédula (11 dígitos) → persona física.
// RNC (9 u 10 dígitos) → persona jurídica.
export function derivarTipoPersona(rnc?: string): TipoPersona {
  const digitos = (rnc ?? "").replace(/\D/g, "");
  if (!digitos) return "consumidor";
  if (digitos.length === 11) return "fisica";
  if (digitos.length === 9 || digitos.length === 10) return "juridica";
  return "consumidor";
}

export interface VentaItemInput {
  productName: string;
  productCode?: string;
  quantity:     number;
  price:        number;
  discount?:    number;   // porcentaje (0-100)
  taxable:      boolean;
}

export interface VentaClienteInput {
  id?:            string;
  name:           string;
  rnc?:           string;
  subtipoFiscal?: SubtipoJuridica;
}

export interface VentaInput {
  id:    string;
  items: VentaItemInput[];
  customer?: VentaClienteInput | null;
}

export interface MapeoVenta {
  factura:  FacturaSinECF;
  cliente:  ClienteFiscal | undefined;
  esWalkIn: boolean;
}

export function mapVentaToFactura(venta: VentaInput): MapeoVenta {
  const esWalkIn = !venta.customer;

  const cliente: ClienteFiscal | undefined = venta.customer
    ? {
        rnc:     venta.customer.rnc,
        nombre:  venta.customer.name,
        tipo:    derivarTipoPersona(venta.customer.rnc),
        subtipo: venta.customer.subtipoFiscal ?? "regular",
      }
    : undefined;

  const items: ItemFactura[] = venta.items.map((item) => {
    const bruto = item.price * item.quantity;
    return {
      codigo:        item.productCode,
      descripcion:   item.productName,
      modo:          "por_unidad" as ModoLinea,
      cantidad:      item.quantity,
      precio:        item.price,
      descuentoMonto: bruto * ((item.discount ?? 0) / 100),
      itbis:         item.taxable ? 0.18 : 0,
    };
  });

  const factura: FacturaSinECF = {
    id:               venta.id,
    fecha:            today(),
    terminos:         "Contado",
    items,
    clienteId:        venta.customer?.id,
    nombreConsumidor: venta.customer?.name ?? "CONSUMIDOR FINAL",
  };

  return { factura, cliente, esWalkIn };
}
