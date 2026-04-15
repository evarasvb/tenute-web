import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from('products').select('id, price, cost_price, stock, stock_ocoa, stock_local, image_url, active');
  const total = products?.length || 0;
  const withImages = products?.filter(p => p.image_url && p.image_url.trim() !== '').length || 0;
  const totalStockValue = products?.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0) || 0;
  const totalCostValue = products?.reduce((sum, p) => sum + (p.cost_price || 0) * ((p.stock_ocoa || 0) + (p.stock_local || 0)), 0) || 0;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  let webOrdersRevenue = 0, webOrdersCount = 0;
  try {
    const { data: orders } = await supabase.from('orders').select('total, subtotal, status, created_at').neq('status', 'cancelled').gte('created_at', thirtyDaysAgo.toISOString());
    webOrdersRevenue = orders?.reduce((sum, o) => sum + (o.total || o.subtotal || 0), 0) || 0;
    webOrdersCount = orders?.length || 0;
  } catch { /* tabla puede no existir */ }
  let manualSalesRevenue = 0, manualSalesCost = 0, manualSalesCount = 0;
  try {
    const { data: manualSales } = await supabase.from('manual_sales').select('total, cost_total, status, created_at').neq('status', 'cancelled').gte('created_at', thirtyDaysAgo.toISOString());
    manualSalesRevenue = manualSales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;
    manualSalesCost = manualSales?.reduce((sum, s) => sum + (s.cost_total || 0), 0) || 0;
    manualSalesCount = manualSales?.length || 0;
  } catch { /* tabla puede no existir aun */ }
  let purchasesTotal = 0, purchasesCount = 0;
  try {
    const { data: purchases } = await supabase.from('purchases').select('total_amount, status, created_at').neq('status', 'cancelled').gte('created_at', thirtyDaysAgo.toISOString());
    purchasesTotal = purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
    purchasesCount = purchases?.length || 0;
  } catch { /* tabla puede no existir aun */ }
  const grossProfit30d = manualSalesRevenue - manualSalesCost;
  const grossMargin30d = manualSalesRevenue > 0 ? (grossProfit30d / manualSalesRevenue * 100) : 0;
  const topMarginProducts = (products || [])
    .filter(p => p.cost_price && p.price && p.cost_price > 0)
    .map(p => ({ margin: ((p.price - p.cost_price!) / p.price * 100) }))
    .sort((a, b) => b.margin - a.margin).slice(0, 5);
  return NextResponse.json({
    totalProducts: total, withImages, withoutImages: total - withImages, totalStockValue, totalCostValue,
    revenue30d: webOrdersRevenue + manualSalesRevenue,
    webOrdersRevenue30d: webOrdersRevenue, webOrdersCount30d: webOrdersCount,
    manualSalesRevenue30d: manualSalesRevenue, manualSalesCount30d: manualSalesCount,
    grossProfit30d, grossMargin30d: Math.round(grossMargin30d * 10) / 10,
    purchasesTotal30d: purchasesTotal, purchasesCount30d: purchasesCount,
    avgCatalogMargin: topMarginProducts.length > 0 ? Math.round(topMarginProducts.reduce((s, p) => s + p.margin, 0) / topMarginProducts.length * 10) / 10 : null,
  });
}
