// Cifrado/almacenamiento de credenciales DGII por empresa (multi-tenant)
//
// El .p12 (certificado + llave privada) y su contraseña se cifran con
// AES-256-GCM usando una clave maestra del servidor (DGII_MASTER_KEY, .env)
// y se guardan en companies/{companyId}/dgii_config/credenciales.
// Nunca se exponen al cliente — solo se desencriptan en el servidor
// (Route Handlers / Server Actions) justo antes de firmar un e-CF.

import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { loadCertAndKey, type CertData } from "./xml-signer";

const ALGO = "aes-256-gcm";

interface EncryptedPayload {
  iv:   string; // base64
  tag:  string; // base64
  data: string; // base64
}

function getMasterKey(): Buffer {
  const hex = process.env.DGII_MASTER_KEY;
  if (!hex) throw new Error("DGII_MASTER_KEY no configurada en .env");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) throw new Error("DGII_MASTER_KEY debe ser una clave hexadecimal de 32 bytes (64 caracteres)");
  return key;
}

function encrypt(plain: Buffer): EncryptedPayload {
  const key    = getMasterKey();
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const data   = Buffer.concat([cipher.update(plain), cipher.final()]);
  return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") };
}

function decrypt(payload: EncryptedPayload): Buffer {
  const key      = getMasterKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(payload.data, "base64")), decipher.final()]);
}

// ── Persistencia por empresa ──────────────────────────────────────────
const credRef = (companyId: string) =>
  adminDb.collection("companies").doc(companyId).collection("dgii_config").doc("credenciales");

// Cifra y guarda el .p12 (binario) + contraseña de una empresa.
export async function guardarCertificado(companyId: string, p12Buffer: Buffer, password: string): Promise<void> {
  await credRef(companyId).set({
    certificado: encrypt(p12Buffer),
    password:    encrypt(Buffer.from(password, "utf8")),
    updatedAt:   new Date().toISOString(),
  }, { merge: true });
}

// Lee y desencripta el certificado de una empresa, listo para firmar.
export async function cargarCertificado(companyId: string): Promise<CertData> {
  const snap = await credRef(companyId).get();
  if (!snap.exists) throw new Error(`La empresa ${companyId} no tiene certificado DGII configurado`);

  const data = snap.data() as { certificado: EncryptedPayload; password: EncryptedPayload };
  const p12Buffer = decrypt(data.certificado);
  const password  = decrypt(data.password).toString("utf8");
  return loadCertAndKey(p12Buffer, password);
}

// Indica si una empresa ya tiene certificado cargado (sin desencriptarlo).
export async function tieneCertificado(companyId: string): Promise<boolean> {
  const snap = await credRef(companyId).get();
  return snap.exists;
}
