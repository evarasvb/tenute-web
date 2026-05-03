import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';

type ProductId = string | number;

function toProductId(value: unknown): ProductId | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    return /^\d+$/.test(value) ? Number(value) : value;
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse();
  }

  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === 'string' ? body.action : 'upsert';

  const supabase = createAdminClient();

  if (action === 'delete') {
    const id = typeof body?.id === 'string' ? body.id : null;
    if (!id) return NextResponse.json({ error: 'id es requerido para delete' }, { status: 400 });

    const { error } = await supabase.from('product_competitor_links').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'toggle') {
    const id = typeof body?.id === 'string' ? body.id : null;
    const active = typeof body?.active === 'boolean' ? body.active : null;
    if (!id || active === null) {
      return NextResponse.json({ error: 'id y active son requeridos para toggle' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('product_competitor_links')
      .update({ active })
      .eq('id', id)
      .select('id, product_id, competitor_id, url, selector, sku_competidor, active')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const productId = toProductId(body?.productId);
  const competitorId = typeof body?.competitorId === 'string' ? body.competitorId : null;
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  const selector = typeof body?.selector === 'string' ? body.selector.trim() : null;
  const skuCompetidor = typeof body?.sku_competidor === 'string' ? body.sku_competidor.trim() : null;
  const id = typeof body?.id === 'string' ? body.id : null;
  const active = typeof body?.active === 'boolean' ? body.active : true;

  if (!productId || !competitorId || !url) {
    return NextResponse.json(
      { error: 'productId, competitorId y url son requeridos para guardar enlace' },
      { status: 400 }
    );
  }

  if (id) {
    const { data, error } = await supabase
      .from('product_competitor_links')
      .update({
        competitor_id: competitorId,
        product_id: productId,
        url,
        selector: selector || null,
        sku_competidor: skuCompetidor || null,
        active,
      })
      .eq('id', id)
      .select('id, product_id, competitor_id, url, selector, sku_competidor, active')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from('product_competitor_links')
    .insert({
      competitor_id: competitorId,
      product_id: productId,
      url,
      selector: selector || null,
      sku_competidor: skuCompetidor || null,
      active,
    })
    .select('id, product_id, competitor_id, url, selector, sku_competidor, active')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET(request: NextRequest) {
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse();
  }

  const { searchParams } = new URL(request.url);
  const productIdParam = searchParams.get('productId');
  if (!productIdParam) {
    return NextResponse.json({ error: 'productId es requerido' }, { status: 400 });
  }

  const productId = toProductId(productIdParam);
  if (!productId) {
    return NextResponse.json({ error: 'productId inválido' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('product_competitor_links')
    .select('id, product_id, competitor_id, url, selector, sku_competidor, active, competitors(id, name, base_url, active)')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
