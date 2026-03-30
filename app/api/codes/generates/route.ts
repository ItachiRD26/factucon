import { NextRequest, NextResponse } from 'next/server';
import { generateCodesForCompany } from '@/lib/db/codes';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { companyId, users } = await req.json();

    if (!companyId || !users?.length) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const codes = await generateCodesForCompany(
      companyId,
      users as Array<{ role: UserRole; label: string }>
    );

    return NextResponse.json({ codes });
  } catch (error: any) {
    console.error('Generate codes error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}