// Soporte del Módulo C — certificación guiada ante la DGII
//
// Ejecuta los casos oficiales de SET_PRUEBAS_DGII (paso "Pruebas TestECF" de la
// certificación) reutilizando el mismo pipeline de firma/envío que las ventas
// reales (firmarYEnviar). Los casos traen su propio eNCF fijo asignado por la
// DGII — NO se generan con nextSecuencia/genECF.

import { adminDb } from "@/lib/firebase/admin";
import type { Company } from "@/lib/types";
import { SET_PRUEBAS_DGII, type CasoPrueba } from "./xml-builder";
import { cargarContextoEmision, firmarYEnviar } from "./emisor";
import { derivarTipoPersona } from "./mapeo";
import type { ClienteFiscal, EstadoDGII, Factura, ItemFactura, TipoECF } from "./types";

export interface ResultadoCaso {
  eNCF:        string;
  tipoECF:     TipoECF;
  estado:      EstadoDGII;
  trackId?:    string;
  urlQR?:      string;
  error?:      string;
  paso:        boolean;
  ejecutadoAt: string;
}

export interface ProgresoCertificacion {
  total:        number;
  completados:  number;
  pasados:      number;
}

const certificacionRef = (companyId: string) =>
  adminDb.collection("companies").doc(companyId).collection("dgii_config").doc("certificacion");

// Snap de la tasa de ITBIS derivada (itbis/montoGravado) al valor más cercano soportado.
function snapItbis(rate: number): 0 | 0.16 | 0.18 {
  const candidatos: (0 | 0.16 | 0.18)[] = [0, 0.16, 0.18];
  return candidatos.reduce((best, c) => Math.abs(c - rate) < Math.abs(best - rate) ? c : best);
}

function casoToFactura(caso: CasoPrueba): { factura: Factura; cliente: ClienteFiscal | undefined } {
  const tipoECF = (`E${caso.tipoECF}`) as TipoECF;
  const itbisRate = caso.montoGravado > 0 ? snapItbis(caso.itbis / caso.montoGravado) : 0;

  const item: ItemFactura = {
    descripcion:    caso.nombreItem,
    modo:           "por_unidad",
    cantidad:       caso.cantItem,
    precio:         caso.precioUnit,
    descuentoMonto: 0,
    itbis:          itbisRate,
  };

  const cliente: ClienteFiscal | undefined = caso.rncComprador
    ? { rnc: caso.rncComprador, nombre: caso.razonComprador ?? "", tipo: derivarTipoPersona(caso.rncComprador), subtipo: "regular" }
    : undefined;

  const factura: Factura = {
    id:               caso.eNCF,
    eCF:              caso.eNCF,
    tipoECF,
    fecha:            caso.fecha,
    vencimientoECF:   caso.vencimiento,
    terminos:         "Contado",
    items:            [item],
    clienteId:        cliente?.rnc,
    nombreConsumidor: cliente ? undefined : (caso.idExtranjero ? "BENEFICIARIO EXTERIOR" : "CONSUMIDOR FINAL"),
    idTransaccion:    caso.idExtranjero,
    eCFRef:           caso.eCFRef,
    motivoNota:       caso.razonMod,
    codigoModificacion: caso.codMod,
  };

  return { factura, cliente };
}

// Ejecuta un caso del set oficial de pruebas y persiste el resultado.
export async function ejecutarCasoPrueba(companyId: string, caso: CasoPrueba): Promise<ResultadoCaso> {
  const tipoECF = (`E${caso.tipoECF}`) as TipoECF;
  let resultado: ResultadoCaso;

  try {
    const ctx = await cargarContextoEmision(companyId);
    const { factura, cliente } = casoToFactura(caso);
    const r = await firmarYEnviar(ctx, factura, cliente, companyId);

    resultado = {
      eNCF:        caso.eNCF,
      tipoECF:     r.tipoECF,
      estado:      r.estado,
      trackId:     r.trackId,
      urlQR:       r.urlQR,
      error:       r.error,
      paso:        r.estado !== "error" && r.estado !== "Rechazado",
      ejecutadoAt: new Date().toISOString(),
    };
  } catch (e) {
    resultado = {
      eNCF:        caso.eNCF,
      tipoECF,
      estado:      "error",
      error:       e instanceof Error ? e.message : "Error desconocido al ejecutar el caso de prueba",
      paso:        false,
      ejecutadoAt: new Date().toISOString(),
    };
  }

  await certificacionRef(companyId).set({
    casos: { [caso.eNCF]: resultado },
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  const snap  = await certificacionRef(companyId).get();
  const casos = (snap.data()?.casos ?? {}) as Record<string, ResultadoCaso>;
  const progreso: ProgresoCertificacion = {
    total:       SET_PRUEBAS_DGII.length,
    completados: Object.keys(casos).length,
    pasados:     Object.values(casos).filter((c) => c.paso).length,
  };
  await certificacionRef(companyId).set({ progreso }, { merge: true });

  return resultado;
}

// Ejecuta todos los casos del set oficial, en orden, uno a la vez.
export async function ejecutarTodosLosCasos(companyId: string): Promise<ResultadoCaso[]> {
  const resultados: ResultadoCaso[] = [];
  for (const caso of SET_PRUEBAS_DGII) {
    resultados.push(await ejecutarCasoPrueba(companyId, caso));
  }
  return resultados;
}

// Confirma el avance manual de ambiente (tras aprobación de la DGII en su Oficina Virtual).
export async function avanzarAmbiente(companyId: string, nuevoAmbiente: "certecf" | "ecf"): Promise<void> {
  const companyRef = adminDb.collection("companies").doc(companyId);
  const snap = await companyRef.get();
  if (!snap.exists) throw new Error(`Empresa ${companyId} no encontrada`);

  const dgiiConfig = (snap.data() as Company).dgiiConfig;
  if (!dgiiConfig) throw new Error("La empresa no tiene configuración DGII");

  const ambienteActual = dgiiConfig.ambiente;
  const transicionValida =
    (ambienteActual === "testecf" && nuevoAmbiente === "certecf") ||
    (ambienteActual === "certecf" && nuevoAmbiente === "ecf");
  if (!transicionValida) {
    throw new Error(`Transición de ambiente inválida: ${ambienteActual} → ${nuevoAmbiente}`);
  }
  if (!dgiiConfig.certificadoCargado) {
    throw new Error("Debe cargar el certificado .p12 antes de avanzar de ambiente");
  }

  const confirmadaAt = new Date().toISOString();
  await companyRef.update({
    "dgiiConfig.ambiente":                 nuevoAmbiente,
    "dgiiConfig.certificacionConfirmadaAt": confirmadaAt,
    updatedAt: new Date(),
  });
  await certificacionRef(companyId).set({ ambienteActual: nuevoAmbiente, updatedAt: confirmadaAt }, { merge: true });
}
