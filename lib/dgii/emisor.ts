// Orquestador central de emisión e-CF — multi-tenant
//
// Carga el contexto fiscal de una empresa (datos del emisor, ambiente, certificado),
// construye/firma el XML correspondiente y lo envía a la DGII. Nunca lanza: cualquier
// error se devuelve como `{ estado: 'error', error }` para no bloquear el flujo de
// venta que lo invoca (ver lib/sales/create-sale.ts).

import { adminDb } from "@/lib/firebase/admin";
import type { Company } from "@/lib/types";
import { cargarCertificado } from "./cert-crypto";
import type { CertData } from "./xml-signer";
import { firmarXML } from "./xml-signer";
import { buildXML, buildRFCEXml, LIMITE_RFCE, fmtRNC } from "./xml-builder";
import { getToken, enviarECF, enviarRFCE } from "./dgii-client";
import { generarURLQR, formatFechaQR, formatFechaHoraQR, calcularCodigoSeguridad } from "./qr-builder";
import { nextSecuencia } from "./secuencias";
import {
  calcTotales, genECF, resolverECFConfig,
  type TipoECF, type DgiiAmbiente, type EmpresaConfig,
  type ClienteFiscal, type Factura, type FacturaSinECF, type EstadoDGII,
} from "./types";

// ── Contexto de emisión ───────────────────────────────────────────────
export interface EmisionContext {
  empresa:    EmpresaConfig;
  ambiente:   DgiiAmbiente;
  rncEmisor:  string;
  cert:       CertData;
  dgiiConfig: NonNullable<Company["dgiiConfig"]>;
}

export interface ResultadoEmision {
  tipoECF: TipoECF;
  eNCF:    string;
  estado:  EstadoDGII;
  trackId?: string;
  urlQR?:   string;
  error?:   string;
}

// Carga datos del emisor + certificado descifrado, listos para firmar.
export async function cargarContextoEmision(companyId: string): Promise<EmisionContext> {
  const snap = await adminDb.collection("companies").doc(companyId).get();
  if (!snap.exists) throw new Error(`Empresa ${companyId} no encontrada`);

  const company    = snap.data() as Company;
  const dgiiConfig = company.dgiiConfig;
  if (!dgiiConfig?.enabled) throw new Error("e-CF no está habilitado para esta empresa");
  if (!dgiiConfig.rnc?.trim()) throw new Error("Falta configurar el RNC en la sección DGII");
  if (!dgiiConfig.actividadEconomica?.trim()) throw new Error("Falta configurar la actividad económica en la sección DGII");

  const cert = await cargarCertificado(companyId);

  return {
    empresa: {
      nombre:             company.name,
      rnc:                dgiiConfig.rnc,
      direccion:          company.address ?? "",
      telefono:           company.phone,
      actividadEconomica: dgiiConfig.actividadEconomica,
    },
    ambiente:  dgiiConfig.ambiente,
    rncEmisor: dgiiConfig.rnc,
    cert,
    dgiiConfig,
  };
}

// SignatureValue viene siempre en una sola línea sin espacios dentro del XML canonicalizado.
function extractSignatureValue(xml: string): string {
  const m = xml.match(/<SignatureValue>([^<]+)<\/SignatureValue>/);
  return m?.[1]?.replace(/\s/g, "") ?? "";
}

// Normaliza el `estado` devuelto por /recepcionfc (RFCE) o por /ConsultaResultado
// (consultarEstado, ver app/api/cron/sync-dgii-status) a nuestro EstadoDGII.
export function mapEstadoRFCE(estadoRaw: string): EstadoDGII {
  const e = (estadoRaw ?? "").trim().toLowerCase();
  if (e.includes("rechaz"))     return "Rechazado";
  if (e.includes("condicional")) return "AceptadoCondicional";
  if (e.includes("acept"))      return "Aceptado";
  return "Enviado";
}

// Construye, firma y envía el XML a la DGII. Decide RFCE vs e-CF completo según
// `tipoECF === 'E32' && total < LIMITE_RFCE`.
//
// Para RFCE, el CodigoSeguridadeCF y el `signatureValue` del QR se derivan de la
// firma del e-CF completo (mismo enfoque validado en el sistema certificado
// soraya-tours-ecf): se firma primero el e-CF completo, se extrae su
// SignatureValue → CodigoSeguridad, y ese código se incrusta en el RFCE antes de
// firmarlo y enviarlo.
export async function firmarYEnviar(
  ctx: EmisionContext,
  factura: Factura,
  cliente: ClienteFiscal | undefined,
  companyId: string,
): Promise<ResultadoEmision> {
  const totales = calcTotales(factura.items);
  const esRFCE  = factura.tipoECF === "E32" && totales.total < LIMITE_RFCE;

  const xmlSinFirma   = buildXML(factura, cliente, ctx.empresa);
  const xmlFirmadoECF = await firmarXML(xmlSinFirma, ctx.cert);
  const signatureValue = extractSignatureValue(xmlFirmadoECF);
  if (!signatureValue) throw new Error("No se pudo extraer SignatureValue del XML firmado");
  const codigoSeguridad = calcularCodigoSeguridad(signatureValue);

  const token = await getToken(companyId, ctx.ambiente, ctx.cert);
  if (!token) throw new Error("No se pudo obtener el token de autenticación de la DGII");

  let trackId: string | undefined;
  let estado: EstadoDGII;

  if (esRFCE) {
    const rfceXmlSinFirma = buildRFCEXml(factura, ctx.empresa, codigoSeguridad, cliente);
    const rfceFirmado     = await firmarXML(rfceXmlSinFirma, ctx.cert);
    const resultado       = await enviarRFCE(ctx.ambiente, rfceFirmado, token, ctx.rncEmisor, factura.eCF);
    trackId = resultado.trackId || undefined;
    estado  = mapEstadoRFCE(resultado.estado);
  } else {
    trackId = await enviarECF(xmlFirmadoECF, token, ctx.rncEmisor, factura.eCF);
    estado  = "Enviado";
  }

  const rncComprador = cliente?.rnc
    ? fmtRNC(cliente.rnc)
    : factura.rncCompradorOcasional
      ? factura.rncCompradorOcasional.replace(/\D/g, "")
      : undefined;

  const urlQR = generarURLQR({
    ambiente:       ctx.ambiente,
    tipoECF:        factura.tipoECF,
    rncEmisor:      fmtRNC(ctx.rncEmisor),
    rncComprador,
    eNCF:           factura.eCF,
    fechaEmision:   formatFechaQR(factura.fecha),
    montoTotal:     totales.total,
    fechaFirma:     formatFechaHoraQR(new Date().toISOString()),
    signatureValue,
    esRFCE,
  });

  return { tipoECF: factura.tipoECF, eNCF: factura.eCF, estado, trackId, urlQR };
}

// Wrapper de alto nivel: resuelve tipo e-CF, asigna secuencia/eNCF, valida
// vencimiento configurado y delega en firmarYEnviar(). Nunca lanza — cualquier
// error se devuelve como `estado: 'error'` para no bloquear la venta que lo invoca.
export async function emitirECF(
  companyId: string,
  factura: FacturaSinECF,
  cliente: ClienteFiscal | undefined,
  esWalkIn: boolean,
  esCompra = false,
): Promise<ResultadoEmision> {
  try {
    const ctx = await cargarContextoEmision(companyId);

    const ecfConfig = resolverECFConfig(cliente, esWalkIn, esCompra);
    const tipoECF: TipoECF = factura.tipoECF && ecfConfig.tiposDisponibles.includes(factura.tipoECF)
      ? factura.tipoECF
      : ecfConfig.tipoDefault;

    const vencimientoECF = ctx.dgiiConfig.vencimientos?.[tipoECF];
    if (!vencimientoECF) {
      return { tipoECF, eNCF: "", estado: "error", error: `Falta fecha de vencimiento configurada para ${tipoECF}` };
    }

    const seq = await nextSecuencia(companyId, tipoECF);
    const eCF = genECF(tipoECF, seq);

    const facturaCompleta: Factura = { ...factura, tipoECF, eCF, vencimientoECF };

    return await firmarYEnviar(ctx, facturaCompleta, cliente, companyId);
  } catch (e) {
    return {
      tipoECF: factura.tipoECF ?? "E32",
      eNCF:    "",
      estado:  "error",
      error:   e instanceof Error ? e.message : "Error desconocido al emitir el e-CF",
    };
  }
}
