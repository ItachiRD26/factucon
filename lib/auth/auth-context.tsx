'use client';

import {
  createContext, useContext, useEffect, useState, ReactNode,
} from 'react';
import {
  User, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, GoogleAuthProvider,
  signInWithPopup, sendPasswordResetEmail, updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { PortalUser } from '@/lib/types';

interface AuthContextType {
  user:          User | null;
  portalUser:    PortalUser | null;
  loading:       boolean;
  login:         (email: string, password: string) => Promise<void>;
  loginGoogle:   () => Promise<void>;
  register:      (email: string, password: string, name: string) => Promise<void>;
  logout:        () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function setSessionCookie(firebaseUser: User): Promise<void> {
  const token = await firebaseUser.getIdToken();
  await fetch('/api/auth/session', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ token }),
  });
}

async function clearSessionCookie(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' });
}

// Genera un nombre legible a partir del email como fallback
function nameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._\-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || 'Usuario';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,       setUser]       = useState<User | null>(null);
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null);
  const [loading,    setLoading]    = useState(true);

  async function loadPortalUser(uid: string) {
    try {
      const snap = await getDoc(doc(db, 'portal_users', uid));
      if (snap.exists()) {
        const data = snap.data();
        setPortalUser({
          ...data, uid,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        } as PortalUser);
      }
    } catch (e) {
      console.error('Error loading portal user:', e);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await Promise.all([
          setSessionCookie(firebaseUser),
          loadPortalUser(firebaseUser.uid),
        ]);
      } else {
        setPortalUser(null);
        await clearSessionCookie();
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function createPortalUserDoc(uid: string, email: string, name: string) {
    await setDoc(doc(db, 'portal_users', uid), {
      uid, email, displayName: name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginGoogle() {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    const { uid, email, displayName } = result.user;

    // Prioridad: nombre de Google → nombre del email → 'Usuario'
    const nameToUse = displayName?.trim() ||
      (email ? nameFromEmail(email) : 'Usuario');

    const snap = await getDoc(doc(db, 'portal_users', uid));
    if (!snap.exists()) {
      await createPortalUserDoc(uid, email!, nameToUse);
    }

    // Cookie explícita antes de retornar para evitar race condition
    await setSessionCookie(result.user);
  }

  async function register(email: string, password: string, name: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await createPortalUserDoc(result.user.uid, email, name);
  }

  async function logout() {
    await clearSessionCookie();
    await signOut(auth);
    setPortalUser(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{
      user, portalUser, loading,
      login, loginGoogle, register, logout, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}