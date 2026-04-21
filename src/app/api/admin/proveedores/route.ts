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
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  let query = supabase.from('proveedores').select('*').order('nombre');

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,rut.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ proveedores: data || [] });
}

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('proveedores')
    .insert({
      nombre: body.nombre,
      rut: body.rut || null,
      contacto: body.contacto || null,
      telefono: body.telefono || null,
      email: body.email || null,
      direccion: body.direccion || null,
      condiciones_pago: body.condiciones_pago || 'contado',
      notas: body.notas || null,
      activo: body.activo !== false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('proveedores')
    .update({
      nombre: body.nombre,
      rut: body.rut || null,
      contacto: body.contacto || null,
      telefono: body.telefono || null,
      email: body.email || null,
      direccion: body.direccion || null,
      condiciones_pago: body.condiciones_pago || 'contado',
      notas: body.notas || null,
      activo: body.activo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }

  const { error } = await supabase.from('proveedores').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
