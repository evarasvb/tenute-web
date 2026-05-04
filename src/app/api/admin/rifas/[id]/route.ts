import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

type DrawMethod = 'random_seed' | 'manual' | 'external';
type RaffleStatus = 'draft' | 'published' | 'closed';

const VALID_DRAW_METHODS: DrawMethod[] = ['random_seed', 'manual', 'external'];
const VALID_STATUSES: RaffleStatus[] = ['draft', 'published', 'closed'];

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function normalizeDateOrNull(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseDrawMethod(value: unknown): DrawMethod | undefined {
  if (typeof value === 'string' && VALID_DRAW_METHODS.includes(value as DrawMethod)) {
    return value as DrawMethod;
  }
  return undefined;
}

function parseStatus(value: unknown): RaffleStatus | undefined {
  if (typeof value === 'string' && VALID_STATUSES.includes(value as RaffleStatus)) {
    return value as RaffleStatus;
  }
  return undefined;
}

function normalizePatchPayload(input: Record<string, unknown>) {
  const output: Record<string, unknown> = {};

  if (typeof input.title === 'string') {
    output.title = input.title.trim();
  }

  if (typeof input.slug === 'string') {
    output.slug = slugify(input.slug);
  }

  if (typeof input.description === 'string') output.description = input.description.trim() || null;
  if (typeof input.hero_image_url === 'string') output.hero_image_url = input.hero_image_url.trim() || null;
  if (typeof input.promo_headline === 'string') output.promo_headline = input.promo_headline.trim() || null;
  if (typeof input.hashtag === 'string') output.hashtag = input.hashtag.trim() || null;
  if (typeof input.draw_place === 'string') output.draw_place = input.draw_place.trim() || null;
  if (typeof input.terms_md === 'string') output.terms_md = input.terms_md.trim() || null;

  if (input.draw_date === null || typeof input.draw_date === 'string') {
    output.draw_date = normalizeDateOrNull(input.draw_date);
  }

  const drawMethod = parseDrawMethod(input.draw_method);
  if (drawMethod) output.draw_method = drawMethod;

  const status = parseStatus(input.status);
  if (status) output.status = status;

  if (input.min_sold_to_draw !== undefined) {
    const parsed = Number(input.min_sold_to_draw);
    if (Number.isFinite(parsed)) {
      output.min_sold_to_draw = Math.max(0, Math.floor(parsed));
    }
  }

  if (input.winner_entry_id === null || typeof input.winner_entry_id === 'string') {
    output.winner_entry_id = input.winner_entry_id;
  }

  return output;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffles')
    .select(
      `
      id,
      title,
      slug,
      description,
      hero_image_url,
      promo_headline,
      hashtag,
      draw_method,
      draw_date,
      draw_place,
      min_sold_to_draw,
      status,
      terms_md,
      winner_entry_id,
      created_at,
      raffle_prizes(
        id,
        raffle_id,
        product_id,
        position,
        title,
        description,
        declared_value,
        quantity,
        reserve_stock,
        created_at,
        product:products(id, name, sku, image_url)
      ),
      raffle_media(
        id,
        raffle_id,
        prize_id,
        kind,
        url,
        alt,
        sort_order,
        created_at
      ),
      raffle_draws(
        id,
        raffle_id,
        seed,
        method,
        winner_entry_id,
        executed_at,
        executed_by
      )
    `
    )
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const payload = normalizePatchPayload(await request.json());
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('raffles').update(payload).eq('id', params.id).select('*').single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una rifa con ese slug' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { error } = await supabase.from('raffles').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
