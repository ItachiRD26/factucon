// Cliente DGII — URLs verificadas según Swagger oficial (sistema certificado 10/10)
// Recepción: /CerteCF/Recepcion/api/FacturasElectronicas
// RFCE:      /{amb}/recepcionfc/api/recepcion/ecf
// Consulta:  /CerteCF/ConsultaResultado/api/Consultas/Estado
//
// Adaptado multi-tenant: cada función recibe el ambiente, RNC y token de la
// empresa que invoca — nada se lee de variables de entorno. El token se
// cachea en memoria por empresa y se persiste en
// companies/{companyId}/dgii_config/token para reutilizarlo entre invocaciones.

import { adminDb } from "@/lib/firebase/admin";
import type { DgiiAmbiente } from "./types";
import type { CertData } from "./xml-signer";
import { firmarSemilla } from "./xml-signer";

const ECF_HOST = "https://ecf.dgii.gov.do";
const FC_HOST  = "https://fc.dgii.gov.do";

function urls(amb: DgiiAmbiente) {
  return {
    semilla:        `${ECF_HOST}/${amb}/autenticacion/api/Autenticacion/Semilla`,
    validarSemilla: `${ECF_HOST}/${amb}/autenticacion/api/Autenticacion/ValidarSemilla`,
    recepcion:      `${ECF_HOST}/CerteCF/Recepcion/api/FacturasElectronicas`,
    rfce:           `${FC_HOST}/${amb}/recepcionfc/api/recepcion/ecf`,
    consulta:       `${ECF_HOST}/CerteCF/ConsultaResultado/api/Consultas/Estado`,
    anulacion:      `${ECF_HOST}/${amb}/anulacion/api/Anulacion`,
  };
}

// ── Caché de token en memoria, por empresa ───────────────────────────
interface TokenCache { token: string; expira: Date }
const tokenCacheMap = new Map<string, TokenCache>();

function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Semilla de autenticación ────────────────────────────────────────
export async function obtenerSemilla(amb: DgiiAmbiente): Promise<string> {
  const res = await fetch(urls(amb).semilla, { headers: { accept: "*/*" } });
  if (!res.ok) throw new Error(`Semilla: ${res.status} ${await res.text()}`);
  return res.text();
}

export async function validarSemilla(amb: DgiiAmbiente, xmlFirmado: string, companyId: string): Promise<string> {
  const form = new FormData();
  form.append("xml", new Blob([xmlFirmado], { type: "text/xml" }), "semilla.xml");
  const res  = await fetch(urls(amb).validarSemilla, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Validar semilla: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (!data.token) throw new Error("DGII no devolvió token");
  tokenCacheMap.set(companyId, { token: data.token, expira: new Date(data.expira) });
  return data.token as string;
}

// ─── Obtener token vigente (caché → Firestore → firma automática) ────
export async function getToken(companyId: string, amb: DgiiAmbiente, cert: CertData): Promise<string> {
  const margen = 5 * 60 * 1000;
  const tokenRef = adminDb.collection("companies").doc(companyId).collection("dgii_config").doc("token");

  // 1. Caché en memoria
  const cached = tokenCacheMap.get(companyId);
  if (cached && cached.expira.getTime() - Date.now() > margen) {
    return cached.token;
  }

  // 2. Token guardado en Firestore
  try {
    const snap = await tokenRef.get();
    if (snap.exists) {
      const data   = snap.data() as { token: string; expira: string };
      const expira = new Date(data.expira);
      if (expira.getTime() - Date.now() > margen) {
        tokenCacheMap.set(companyId, { token: data.token, expira });
        return data.token;
      }
    }
  } catch (e) {
    console.warn(`[DGII] No se pudo leer token de Firestore (${companyId}):`, e instanceof Error ? e.message : e);
  }

  // 3. Firma automática de la semilla
  try {
    const xml      = await obtenerSemilla(amb);
    const firmado  = await firmarSemilla(xml, cert);
    const token    = await validarSemilla(amb, firmado, companyId);
    const cached2  = tokenCacheMap.get(companyId);
    if (cached2) {
      await tokenRef.set({ token: cached2.token, expira: cached2.expira.toISOString() });
    }
    return token;
  } catch (e) {
    console.warn(`[DGII] Auth automática fallida (${companyId}):`, e instanceof Error ? e.message : e);
    return "";
  }
}

// ─── Enviar e-CF → retorna TrackId ────────────────────────────────────
export async function enviarECF(xmlFirmado: string, token: string, rnc: string, encf?: string): Promise<string> {
  // DGII requiere filename = RNCEmisor + eNCF + ".xml" (longitud exacta)
  const filename = encf ? `${rnc}${encf}.xml` : "ecf.xml";
  const form = new FormData();
  form.append("xml", new Blob([xmlFirmado], { type: "text/xml" }), filename);

  const res  = await fetch(urls("ecf").recepcion, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Envío eCF: ${res.status} — ${text}`);

  // Respuesta: { trackId, error, mensaje }
  try {
    const data = JSON.parse(text);
    if (data.trackId) return data.trackId;
    if (data.error)   throw new Error(data.error);
  } catch { /* si no es JSON, buscar trackId en texto */ }

  const match = text.match(/"trackId"\s*:\s*"([^"]+)"/);
  if (match) return match[1];
  throw new Error(`DGII no devolvió trackId. Respuesta: ${text.substring(0, 300)}`);
}

// ─── Enviar RFCE ───────────────────────────────────────────────────────
export async function enviarRFCE(amb: DgiiAmbiente, xmlFirmado: string, token: string, rnc: string, encf?: string): Promise<{ trackId: string; estado: string }> {
  // DGII requiere filename = RNCEmisor + eNCF + ".xml"
  const filename = encf ? `${rnc}${encf}.xml` : "rfce.xml";
  const form = new FormData();
  form.append("xml", new Blob([xmlFirmado], { type: "text/xml" }), filename);

  const res  = await fetch(urls(amb).rfce, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Envío RFCE: ${res.status} — ${text}`);

  try {
    const data = JSON.parse(text);
    return {
      trackId: data.encf  ?? data.trackId ?? "",
      estado:  data.estado ?? "",
    };
  } catch {
    return { trackId: "", estado: text };
  }
}

// ─── Consultar estado por TrackId ────────────────────────────────────
export async function consultarEstado(trackId: string, token: string): Promise<{
  estado: string; mensajes: string[]; eCF?: string;
}> {
  const url = `${urls("ecf").consulta}?trackId=${trackId}`;
  const res = await fetch(url, {
    headers: { ...authHeaders(token), accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Consulta TrackId: ${res.status}`);
  const data = await res.json();
  return {
    estado:   data.estado    ?? "Desconocido",
    mensajes: data.mensajes?.map((m: { valor?: string; codigo?: string }) => m.valor ?? m.codigo ?? "") ?? [],
    eCF:      data.encf      ?? data.eNCF,
  };
}

// ─── Anular e-NCF ──────────────────────────────────────────────────────
export async function anularENCF(amb: DgiiAmbiente, xmlFirmado: string, token: string): Promise<void> {
  const form = new FormData();
  form.append("xml", new Blob([xmlFirmado], { type: "text/xml" }), "anulacion.xml");
  const res = await fetch(urls(amb).anulacion, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  if (!res.ok) throw new Error(`Anulación: ${res.status} — ${await res.text()}`);
}
