import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS      = ['/', '/auth/login', '/auth/register', '/auth/forgot-password'];
const PROTECTED_PREFIXES = ['/portal'];

export function proxy(req: NextRequest) {
  const hostname  = req.headers.get('host') ?? '';
  const { pathname } = req.nextUrl;

  // ── Archivos estáticos y API → siempre pasan ─────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')   ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ── Detectar si es subdominio de facturacion ──────────────
  // micasa.facturacon.cfd → es subdominio
  // facturacon.cfd / www.facturacon.cfd → NO es subdominio
  const isSubdomain =
    /^[a-z0-9-]+\.facturacon\.cfd$/i.test(hostname) &&
    !hostname.startsWith('www.') &&
    hostname !== 'facturacon.cfd';

  // También detectar localhost con subdominio para desarrollo
  // e.g. micasa.localhost:3000
  const isLocalSubdomain =
    /^[a-z0-9-]+\.localhost(:\d+)?$/i.test(hostname);

  if (isSubdomain || isLocalSubdomain) {
    const slug = hostname.split('.')[0];

    // Si ya está en /sistema → dejar pasar
    if (pathname.startsWith('/sistema')) {
      return NextResponse.next();
    }

    // Reescribir al sistema de facturación
    return NextResponse.rewrite(
      new URL(`/sistema/${slug}${pathname === '/' ? '' : pathname}`, req.url)
    );
  }

  // ── Portal principal (facturacon.cfd) ─────────────────────
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (isProtected) {
    const session = req.cookies.get('factucon-session');
    if (!session) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};