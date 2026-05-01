import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('rifas')
    .select('*, prizes:rifa_prizes(*, product:products(id,name,sku,image_url,stock_ocoa,stock_local21))')
    .eq('id', params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ rifa: data });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await request.json();
  const { title, description, status, ticket_price, max_per_person, whatsapp_number, bank_info, draw_date } = body;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('rifas')
    .update({
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(status !== undefined && { status }),
      ...(ticket_price !== undefined && { ticket_price: parseInt(ticket_price) || 0 }),
      ...(max_per_person !== undefined && { max_per_person: max_per_person ? parseInt(max_per_person) : null }),
      ...(whatsapp_number !== undefined && { whatsapp_number: whatsapp_number.trim() }),
      ...(bank_info !== undefined && { bank_info: bank_info?.trim() || null }),
      ...(draw_date !== undefined && { draw_date: draw_date || null }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rifa: data });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = createAdminClient();

  // Restore stock for inventory prizes before deleting
  const { data: prizes } = await supabase
    .from('rifa_prizes')
    .select('product_id')
    .eq('rifa_id', params.id)
    .not('product_id', 'is', null);

  if (prizes?.length) {
    for (const prize of prizes) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_ocoa')
        .eq('id', prize.product_id)
        .single();
      if (product) {
        await supabase.from('products').update({ stock_ocoa: (product.stock_ocoa || 0) + 1 }).eq('id', prize.product_id);
      }
    }
  }

  const { error } = await supabase.from('rifas').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
