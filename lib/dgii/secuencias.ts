// Numeración e-CF por empresa — transaccional vía Firebase Admin
// Cada empresa mantiene su propio contador por TipoeCF en
// companies/{companyId}/dgii_config/secuencias, ej: { E31: 12, E32: 87, ... }
//
// Adaptado de usesecuencias.ts (soraya-tours-ecf), que usaba un único
// documento global config/secuencias vía el SDK de cliente.

import { adminDb } from "@/lib/firebase/admin";
import type { TipoECF } from "./types";

const secuenciasRef = (companyId: string) =>
  adminDb.collection("companies").doc(companyId).collection("dgii_config").doc("secuencias");

export async function nextSecuencia(companyId: string, tipoECF: TipoECF): Promise<number> {
  const ref = secuenciasRef(companyId);
  return adminDb.runTransaction(async (tx) => {
    const snap    = await tx.get(ref);
    const current = snap.exists ? ((snap.data() as Record<string, number>)[tipoECF] ?? 0) : 0;
    const next    = current + 1;
    tx.set(ref, { [tipoECF]: next }, { merge: true });
    return next;
  });
}
