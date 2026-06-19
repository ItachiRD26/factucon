// Creación de ventas — compartido entre el POS (/api/sistema/sales) y la API
// pública (/api/v1/sales).
//
// Mantiene la lógica histórica (contador V-NNNNNN, escritura en `sales`, ajuste
// de stock + inventory_movements) y, si la empresa tiene e-CF habilitado, emite
// el comprobante fiscal automáticamente (lib/dgii/emisor.ts). Si no está
// habilitado, conserva el flujo NCF legado (`ncfType`) sin cambios.

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Company } from '@/lib/types';
import type { SubtipoJuridica } from '@/lib/dgii/types';
import { mapVentaToFactura } from '@/lib/dgii/mapeo';
import { emitirECF, type ResultadoEmision } from '@/lib/dgii/emisor';

export interface CreateSaleItem {
  productId:   string;
  productName: string;
  productCode: string;
  qty:         number;
  price:       number;
  discount?:   number;   // porcentaje (0-100)
  taxable?:    boolean;
}

export interface CreateSaleCustomer {
  id?:            string;
  name:           string;
  rnc?:           string;
  subtipoFiscal?: SubtipoJuridica;
}

export interface CreateSalePayload {
  cashierId?:    string;
  cashierName?:  string;
  items:         CreateSaleItem[];
  subtotal:      number;
  tax:           number;
  total:         number;
  paymentMethod: string;
  amountPaid?:   number;
  change?:       number;
  ncfType?:      string;
  customer?:     CreateSaleCustomer | null;
}

export interface CreateSaleResult {
  saleId:     string;
  saleNumber: string;
  dgii:       ResultadoEmision | null;
}

export async function createSale(companyId: string, payload: CreateSalePayload): Promise<CreateSaleResult> {
  const {
    cashierId, cashierName, items, subtotal, tax, total,
    paymentMethod, amountPaid, change, ncfType, customer,
  } = payload;

  if (!items?.length) throw new Error('La venta debe tener al menos un ítem');

  // Generar número de venta
  const counterRef  = adminDb.collection('counters').doc(companyId);
  const counterSnap = await counterRef.get();
  const currentNum  = (counterSnap.data()?.sales ?? 0) + 1;
  await counterRef.set({ sales: currentNum }, { merge: true });
  const saleNumber = `V-${String(currentNum).padStart(6, '0')}`;

  const now    = Timestamp.now();
  const saleRef = adminDb.collection('sales').doc();

  const mappedItems = items.map((item) => ({
    productId:   item.productId,
    productName: item.productName,
    productCode: item.productCode,
    quantity:    item.qty,
    price:       item.price,
    discount:    item.discount ?? 0,
    tax:         item.taxable ? item.price * item.qty * 0.18 : 0,
    subtotal:    item.price * item.qty * (1 - (item.discount ?? 0) / 100),
    total:       item.price * item.qty * (1 - (item.discount ?? 0) / 100) + (item.taxable ? item.price * item.qty * 0.18 : 0),
  }));

  const companySnap = await adminDb.collection('companies').doc(companyId).get();
  const company      = companySnap.data() as Company | undefined;

  const saleDoc: Record<string, unknown> = {
    id:            saleRef.id,
    companyId,
    saleNumber,
    customer:      customer ?? null,
    items:         mappedItems,
    subtotal,
    tax,
    total,
    paymentMethod,
    amountPaid,
    change:        change ?? 0,
    cashierId,
    cashierName,
    createdAt:     now,
  };

  let dgii: ResultadoEmision | null = null;

  if (company?.dgiiConfig?.enabled) {
    const { factura, cliente, esWalkIn } = mapVentaToFactura({
      id:    saleRef.id,
      items: items.map((item) => ({
        productName: item.productName,
        productCode: item.productCode,
        quantity:    item.qty,
        price:       item.price,
        discount:    item.discount ?? 0,
        taxable:     !!item.taxable,
      })),
      customer: customer ?? null,
    });

    dgii = await emitirECF(companyId, factura, cliente, esWalkIn, false);
    saleDoc.dgii = dgii;
  } else {
    saleDoc.ncfType = ncfType ?? 'B02';
  }

  await saleRef.set(saleDoc);

  // Cada venta cuenta como un comprobante hacia el límite mensual del plan,
  // sin importar el resultado de e-CF — el excedente se cobra en el ciclo
  // siguiente (ver app/api/paypal/weebhook/route.ts).
  await adminDb.collection('companies').doc(companyId).update({
    'subscription.comprobantesUsed': FieldValue.increment(1),
  });

  // Actualizar stock de cada producto + registrar movimiento de inventario
  const batch = adminDb.batch();
  for (const item of items) {
    const productSnap = await adminDb
      .collection('products')
      .where('companyId', '==', companyId)
      .where('code', '==', item.productCode)
      .limit(1)
      .get();

    if (!productSnap.empty) {
      batch.update(productSnap.docs[0].ref, {
        stock:     FieldValue.increment(-item.qty),
        updatedAt: now,
      });
      const movRef = adminDb.collection('inventory_movements').doc();
      batch.set(movRef, {
        id:            movRef.id,
        companyId,
        productId:     productSnap.docs[0].id,
        productName:   item.productName,
        type:          'sale',
        quantity:      -item.qty,
        referenceType: 'sale',
        referenceId:   saleRef.id,
        createdAt:     now,
        createdBy:     cashierId,
      });
    }
  }
  await batch.commit();

  return { saleId: saleRef.id, saleNumber, dgii };
}
