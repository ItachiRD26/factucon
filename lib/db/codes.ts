import {
  collection, doc, getDocs, setDoc,
  updateDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ActivationCode, UserRole } from '@/lib/types';

const COL = 'activation_codes';

function generateCode(role: UserRole, index: number): string {
  const year    = new Date().getFullYear();
  const random  = Math.random().toString(36).slice(2, 6).toUpperCase();
  const roleTag = role.slice(0, 4).toUpperCase();
  return `FC-${year}-${random}-${roleTag}${index}`;
}

export async function generateCodesForCompany(
  companyId: string,
  users: Array<{ role: UserRole; label: string }>
): Promise<ActivationCode[]> {
  const codes: ActivationCode[] = [];

  for (let i = 0; i < users.length; i++) {
    const { role, label } = users[i];
    const code: ActivationCode = {
      code:      generateCode(role, i + 1),
      companyId,
      role,
      label,
      isActive:  true,
      createdAt: new Date(),
    };

    await setDoc(doc(db, COL, code.code), {
      ...code,
      createdAt: serverTimestamp(),
    });

    codes.push(code);
  }

  return codes;
}

export async function getCodesByCompany(companyId: string): Promise<ActivationCode[]> {
  const q    = query(collection(db, COL), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      createdAt:   data.createdAt?.toDate?.()   ?? new Date(),
      lastUsedAt:  data.lastUsedAt?.toDate?.()  ?? undefined,
    } as ActivationCode;
  });
}

export async function validateCode(code: string): Promise<ActivationCode | null> {
  const snap = await getDocs(
    query(collection(db, COL), where('code', '==', code), where('isActive', '==', true))
  );
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  await updateDoc(snap.docs[0].ref, { lastUsedAt: serverTimestamp() });
  return { ...data, createdAt: data.createdAt?.toDate?.() ?? new Date() } as ActivationCode;
}

export async function deactivateCode(code: string): Promise<void> {
  const snap = await getDocs(query(collection(db, COL), where('code', '==', code)));
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { isActive: false });
  }
}