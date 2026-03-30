import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/session → establece la cookie de sesión
export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('factucon-session', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7, // 7 días
    path:     '/',
  });

  return res;
}

// DELETE /api/auth/session → elimina la cookie de sesión
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('factucon-session');
  return res;
}