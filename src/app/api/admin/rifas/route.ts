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

function parseDrawMethod(value: unknown): DrawMethod {
  if (typeof value === 'string' && VALID_DRAW_METHODS.includes(value as DrawMethod)) {
    return value as DrawMethod;
  }
  return 'random_seed';
}

function parseStatus(value: unknown): RaffleStatus {
  if (typeof value === 'string' && VALID_STATUSES.includes(value as RaffleStatus)) {
    return value as RaffleStatus;
  }
  return 'draft';
}

function normalizePayload(input: Record<string, unknown>) {
  const title = String(input.title || '').trim();
  const slugInput = String(input.slug || '').trim();
  const slug = slugify(slugInput || title);
  const minSoldRaw = Number(input.min_sold_to_draw ?? 0);
  const minSoldToDraw = Number.isFinite(minSoldRaw) ? Math.max(0, Math.floor(minSoldRaw)) : 0;

  return {
    title,
    slug,
    description: String(input.description || '').trim() || null,
    hero_image_url: String(input.hero_image_url || '').trim() || null,
    promo_headline: String(input.promo_headline || '').trim() || null,
    hashtag: String(input.hashtag || '').trim() || null,
    draw_method: parseDrawMethod(input.draw_method),
    draw_date: normalizeDateOrNull(input.draw_date),
    draw_place: String(input.draw_place || '').trim() || null,
    min_sold_to_draw: minSoldToDraw,
    status: parseStatus(input.status),
    terms_md: String(input.terms_md || '').trim() || null,
  };
}

function getNestedCount(value: unknown) {
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as { count?: number };
    return Number(first?.count || 0);
  }
  return 0;
}

export async function GET(request: NextRequest) {
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
      status,
      draw_method,
      draw_date,
      winner_entry_id,
      created_at,
      raffle_prizes(count),
      raffle_media(count),
      raffle_entries(count)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows =
    data?.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      draw_method: row.draw_method,
      draw_date: row.draw_date,
      winner_entry_id: row.winner_entry_id,
      created_at: row.created_at,
      prizes_count: getNestedCount(row.raffle_prizes),
      media_count: getNestedCount(row.raffle_media),
      entries_count: getNestedCount(row.raffle_entries),
    })) || [];

  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const payload = normalizePayload(await request.json());
  if (!payload.title) {
    return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
  }
  if (!payload.slug) {
    return NextResponse.json({ error: 'El slug es obligatorio' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('raffles').insert(payload).select('*').single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una rifa con ese slug' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
