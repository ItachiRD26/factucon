import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
  }

  try {
    const snap = await adminDb
      .collection('products')
      .where('companyId', '==', companyId)
      .where('isActive', '==', true)
      .get();

    const products = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id:       doc.id,
        code:     data.code,
        name:     data.name,
        price:    data.price,
        cost:     data.cost,
        stock:    data.stock,
        category: data.category ?? 'General',
        taxable:  data.taxable ?? true,
        barcode:  data.barcode ?? '',
        image:    data.image ?? null,
      };
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}