import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const period    = searchParams.get('period') ?? 'month';
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let   from  = new Date(now.getFullYear(), now.getMonth(), 1);

  if (period === 'today') from = today;
  if (period === 'week')  { from = new Date(today); from.setDate(today.getDate() - 7); }

  const snap = await adminDb
    .collection('sales')
    .where('companyId', '==', companyId)
    .where('createdAt', '>=', Timestamp.fromDate(from))
    .orderBy('createdAt', 'desc')
    .get();

  const sales = snap.docs.map(d => d.data());

  const todaySnap = sales.filter(s => s.createdAt?.toDate?.() >= today);

  const todaySales  = todaySnap.length;
  const todayTotal  = todaySnap.reduce((sum, s) => sum + (s.total ?? 0), 0);
  const monthSales  = sales.length;
  const monthTotal  = sales.reduce((sum, s) => sum + (s.total ?? 0), 0);
  const monthTax    = sales.reduce((sum, s) => sum + (s.tax ?? 0), 0);

  // Top productos
  const productMap: Record<string, { name: string; qty: number; total: number }> = {};
  for (const sale of sales) {
    for (const item of sale.items ?? []) {
      const key = item.productName;
      if (!productMap[key]) productMap[key] = { name: key, qty: 0, total: 0 };
      productMap[key].qty   += item.quantity ?? 0;
      productMap[key].total += item.total    ?? 0;
    }
  }
  const topProducts = Object.values(productMap).sort((a, b) => b.total - a.total).slice(0, 10);

  // Por método de pago
  const methodMap: Record<string, { method: string; total: number; count: number }> = {};
  for (const sale of sales) {
    const m = sale.paymentMethod ?? 'cash';
    if (!methodMap[m]) methodMap[m] = { method: m, total: 0, count: 0 };
    methodMap[m].total += sale.total ?? 0;
    methodMap[m].count += 1;
  }
  const METHOD_LABELS: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito' };
  const salesByMethod = Object.values(methodMap).map(m => ({ ...m, method: METHOD_LABELS[m.method] ?? m.method }));

  const recentSales = sales.slice(0, 30).map(s => ({
    number: s.saleNumber,
    client: s.customer?.name ?? '',
    total:  s.total ?? 0,
    method: METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod,
    date:   s.createdAt?.toDate?.()?.toLocaleDateString('es-DO') ?? '',
  }));

  return NextResponse.json({ todaySales, todayTotal, monthSales, monthTotal, monthTax, topProducts, salesByMethod, recentSales });
}