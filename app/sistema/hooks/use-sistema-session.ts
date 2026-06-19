'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export interface SistemaSession {
  companyId:    string;
  slug:         string;
  role:         string;
  label:        string;
  modules:      string[];
  companyName:  string;
  primaryColor: string;
  templateId:   string;
  exp:          number;
}

export function useSistemaSession() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();
  const [session, setSession] = useState<SistemaSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie('sistema-session');
    if (!token) { router.replace(`/sistema/${slug}`); return; }

    try {
      const decoded = jwtDecode<SistemaSession>(token);
      if (decoded.exp * 1000 < Date.now()) {
        deleteCookie('sistema-session');
        router.replace(`/sistema/${slug}`);
        return;
      }
      if (decoded.slug !== slug) {
        router.replace(`/sistema/${slug}`);
        return;
      }
      setSession(decoded);
    } catch {
      router.replace(`/sistema/${slug}`);
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  return { session, loading, slug };
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}