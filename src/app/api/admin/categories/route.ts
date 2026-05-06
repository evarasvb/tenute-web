import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
    const session = request.cookies.get('admin_session');
    if (session?.value !== 'authenticated') {
          return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return null;
}

export async function GET(request: NextRequest) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const supabase = createAdminClient();

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: prodCounts } = await supabase
      .from('products')
      .select('category_id');

    const { data: subCounts } = await supabase
      .from('products')
      .select('subcategory_id');

    const countMap: Record<string, number> = {};
    if (prodCounts) {
          prodCounts.forEach((row) => {
                  if (row.category_id) countMap[row.category_id] = (countMap[row.category_id] || 0) + 1;
          });
    }
    if (subCounts) {
          subCounts.forEach((row) => {
                  if (row.subcategory_id) countMap[row.subcategory_id] = (countMap[row.subcategory_id] || 0) + 1;
          });
    }

    type CatNode = typeof allCats[0];
    const allCats = (categories || []).map((cat) => ({
          ...cat,
          product_count: countMap[cat.id] || 0,
          children: [] as typeof categories,
    }));

    const catMap: Record<string, CatNode> = {};
    allCats.forEach((c) => { catMap[c.id] = c; });

    const roots: CatNode[] = [];
    allCats.forEach((c) => {
          if (c.parent_id && catMap[c.parent_id]) {
                  catMap[c.parent_id].children.push(c);
          } else {
                  roots.push(c);
          }
    });

    return NextResponse.json(roots);
}

export async function POST(request: NextRequest) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const supabase = createAdminClient();
    const body = await request.json();

    const { name, description, parent_id } = body;
    if (!name?.trim()) {
          return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data, error } = await supabase
      .from('categories')
      .insert({
              name: name.trim(),
              slug,
              description: description?.trim() || null,
              parent_id: parent_id || null,
      })
      .select()
      .single();

    if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
