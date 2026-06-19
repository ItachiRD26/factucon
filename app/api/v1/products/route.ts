import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticateApiKey } from '@/lib/api/auth';

// GET /api/v1/products — lista de solo lectura de los productos activos de la empresa de la API key.
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: 'API key inválida o revocada' }, { status: 401 });

  const snap = await adminDb.collection('products')
    .where('companyId', '==', auth.companyId)
    .where('isActive', '==', true)
    .get();

  const products = snap.docs.map(doc => {
    const data = doc.data();
    return {
      id:       doc.id,
      code:     data.code,
      name:     data.name,
      price:    data.price,
      stock:    data.stock,
      category: data.category ?? 'General',
      taxable:  data.taxable ?? true,
      barcode:  data.barcode ?? '',
    };
  });

  return NextResponse.json({ products });
}
