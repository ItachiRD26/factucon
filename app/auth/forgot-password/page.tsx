'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--sh-md)',
        }}
      >
        <h1
          className="text-2xl font-extrabold mb-2"
          style={{ color: 'var(--t1)' }}
        >
          Recuperar contraseña
        </h1>

        <p className="text-sm mb-6" style={{ color: 'var(--t2)' }}>
          Esta página aún está en construcción.
        </p>

        <Link
          href="/auth/login"
          className="inline-block font-semibold"
          style={{ color: 'var(--brand)' }}
        >
          ← Volver al login
        </Link>
      </div>
    </div>
  );
}