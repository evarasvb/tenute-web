import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { ticket_numbers, buyer_name, buyer_phone } = body;

  if (!Array.isArray(ticket_numbers) || ticket_numbers.length === 0)
    return NextResponse.json({ error: 'Debes seleccionar al menos un número' }, { status: 400 });
  if (!buyer_name?.trim())
    return NextResponse.json({ error: 'Tu nombre es requerido' }, { status: 400 });
  if (!buyer_phone?.trim())
    return NextResponse.json({ error: 'Tu teléfono es requerido' }, { status: 400 });

  const supabase = createAdminClient();

  // Verify rifa is active
  const { data: rifa } = await supabase
    .from('rifas')
    .select('id, title, total_tickets, ticket_price, max_per_person, whatsapp_number, bank_info, status')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (!rifa) return NextResponse.json({ error: 'La rifa no está disponible' }, { status: 400 });

  // Validate max_per_person
  if (rifa.max_per_person && ticket_numbers.length > rifa.max_per_person)
    return NextResponse.json({ error: `Máximo ${rifa.max_per_person} número(s) por persona` }, { status: 400 });

  // Check all requested numbers are still available
  const { data: existing } = await supabase
    .from('rifa_tickets')
    .select('ticket_number, status')
    .eq('rifa_id', params.id)
    .in('ticket_number', ticket_numbers);

  const unavailable = (existing || []).filter((t) => t.status !== 'available');
  if (unavailable.length > 0) {
    const nums = unavailable.map((t) => t.ticket_number).join(', ');
    return NextResponse.json({ error: `Los números ${nums} ya no están disponibles` }, { status: 409 });
  }

  // Mark as pending
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('rifa_tickets')
    .update({ status: 'pending', buyer_name: buyer_name.trim(), buyer_phone: buyer_phone.trim(), reserved_at: now })
    .eq('rifa_id', params.id)
    .in('ticket_number', ticket_numbers);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = (rifa.ticket_price || 0) * ticket_numbers.length;
  const numsStr = ticket_numbers.sort((a: number, b: number) => a - b).join(', ');

  return NextResponse.json({
    success: true,
    ticket_numbers,
    whatsapp_number: rifa.whatsapp_number,
    whatsapp_message: `Hola! Quiero reservar los números *${numsStr}* para la rifa *${rifa.title}*.\n\nNombre: ${buyer_name.trim()}\nTeléfono: ${buyer_phone.trim()}\n\n${ticket_numbers.length} número(s) × $${(rifa.ticket_price || 0).toLocaleString('es-CL')} = *$${total.toLocaleString('es-CL')}*\n\n${rifa.bank_info ? `Datos para transferir:\n${rifa.bank_info}` : ''}`.trim(),
  });
}
