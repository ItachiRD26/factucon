import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { PortalUser } from '@/lib/types';

const COL = 'portal_users';

export async function getPortalUser(uid: string): Promise<PortalUser | null> {
  const snap = await getDoc(doc(db, COL, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data, uid,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  } as PortalUser;
}

export async function updatePortalUser(
  uid: string,
  updates: Partial<Pick<PortalUser, 'displayName' | 'phone' | 'avatarUrl'>>
): Promise<void> {
  await updateDoc(doc(db, COL, uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function createPortalUser(
  uid: string, email: string, displayName: string
): Promise<void> {
  await setDoc(doc(db, COL, uid), {
    uid, email, displayName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}