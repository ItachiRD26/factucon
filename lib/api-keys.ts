// Claves de API por empresa, para autenticar /api/v1/* (Sección Desarrolladores).
//
// Colección top-level `api_keys`: { id, companyId, label, hash, prefix, createdAt,
// lastUsedAt, revoked }. Solo se guarda el hash sha256 de la clave cruda — la clave
// completa (`rawKey`) se devuelve una única vez al generarla.

import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface ApiKey {
  id:          string;
  companyId:   string;
  label:       string;
  prefix:      string;
  createdAt:   string;
  lastUsedAt:  string | null;
  revoked:     boolean;
}

const COLLECTION = 'api_keys';

function hash(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export async function generateApiKey(companyId: string, label: string): Promise<{ id: string; rawKey: string }> {
  const rawKey = 'fc_live_' + crypto.randomBytes(24).toString('hex');
  const id     = crypto.randomUUID();
  const now    = Timestamp.now();

  await adminDb.collection(COLLECTION).doc(id).set({
    id,
    companyId,
    label:      label.trim(),
    hash:       hash(rawKey),
    prefix:     rawKey.slice(0, 12),
    createdAt:  now,
    lastUsedAt: null,
    revoked:    false,
  });

  return { id, rawKey };
}

export async function listApiKeys(companyId: string): Promise<ApiKey[]> {
  const snap = await adminDb.collection(COLLECTION)
    .where('companyId', '==', companyId)
    .where('revoked', '==', false)
    .get();

  return snap.docs.map(d => {
    const data = d.data();
    return {
      id:         d.id,
      companyId:  data.companyId,
      label:      data.label,
      prefix:     data.prefix,
      createdAt:  data.createdAt?.toDate?.()?.toISOString() ?? null,
      lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString() ?? null,
      revoked:    data.revoked ?? false,
    };
  });
}

export async function revokeApiKey(companyId: string, keyId: string): Promise<void> {
  const ref  = adminDb.collection(COLLECTION).doc(keyId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.companyId !== companyId) {
    throw new Error('Clave de API no encontrada');
  }
  await ref.update({ revoked: true });
}

export async function verifyApiKey(rawKey: string): Promise<{ companyId: string; keyId: string } | null> {
  const snap = await adminDb.collection(COLLECTION)
    .where('hash', '==', hash(rawKey))
    .where('revoked', '==', false)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  await doc.ref.update({ lastUsedAt: Timestamp.now() });
  return { companyId: doc.data().companyId, keyId: doc.id };
}
