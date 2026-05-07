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

  // Fix 3: validate all ticket numbers are integers within 1..total_tickets
  const invalid = ticket_numbers.filter(
    (n: unknown) => !Number.isInteger(n) || (n as number) < 1 || (n as number) > rifa.total_tickets,
  );
  if (invalid.length > 0)
    return NextResponse.json({ error: 'Números de ticket inválidos' }, { status: 400 });

  // Validate max_per_person
  if (rifa.max_per_person && ticket_numbers.length > rifa.max_per_person)
    return NextResponse.json({ error: `Máximo ${rifa.max_per_person} número(s) por persona` }, { status: 400 });

  // Fix 1: atomic claim — UPDATE only rows still 'available', get back what was actually updated
  const now = new Date().toISOString();
  const { data: claimed, error } = await supabase
    .from('rifa_tickets')
    .update({ status: 'pending', buyer_name: buyer_name.trim(), buyer_phone: buyer_phone.trim(), reserved_at: now })
    .eq('rifa_id', params.id)
    .in('ticket_number', ticket_numbers)
    .eq('status', 'available')
    .select('ticket_number');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If fewer rows were updated than requested, some were taken concurrently — rollback and report
  if (!claimed || claimed.length < ticket_numbers.length) {
    if (claimed && claimed.length > 0) {
      await supabase
        .from('rifa_tickets')
        .update({ status: 'available', buyer_name: null, buyer_phone: null, reserved_at: null })
        .eq('rifa_id', params.id)
        .in('ticket_number', claimed.map((t: { ticket_number: number }) => t.ticket_number));
    }
    return NextResponse.json(
      { error: 'Algunos números ya no están disponibles. Por favor recarga la página e intenta de nuevo.' },
      { status: 409 },
    );
  }

  const total = (rifa.ticket_price || 0) * ticket_numbers.length;
  const numsStr = ticket_numbers.sort((a: number, b: number) => a - b).join(', ');

  return NextResponse.json({
    success: true,
    ticket_numbers,
    whatsapp_number: rifa.whatsapp_number,
    whatsapp_message: `Hola! Quiero reservar los números *${numsStr}* para la rifa *${rifa.title}*.\n\nNombre: ${buyer_name.trim()}\nTeléfono: ${buyer_phone.trim()}\n\n${ticket_numbers.length} número(s) × $${(rifa.ticket_price || 0).toLocaleString('es-CL')} = *$${total.toLocaleString('es-CL')}*\n\n${rifa.bank_info ? `Datos para transferir:\n${rifa.bank_info}` : ''}`.trim(),
  });
}
