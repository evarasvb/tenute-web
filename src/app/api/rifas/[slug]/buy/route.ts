import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createFlowPayment, isFlowEnabled } from '@/lib/flow';

function randomDigits(len: number) {
  let result = '';
  for (let i = 0; i < len; i += 1) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  if (!isFlowEnabled()) {
    return NextResponse.json({ error: 'Flow.cl no está configurado' }, { status: 503 });
  }

  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const raffleSlug = params.slug;
    const number = Number(body.number);
    const customerName = String(body.customer_name || '').trim();
    const customerPhone = String(body.customer_phone || '').trim();
    const customerEmailRaw = String(body.customer_email || '').trim();
    const customerEmail = customerEmailRaw || process.env.TENUTE_BILLING_EMAIL || 'tenute@gmail.com';

    if (!raffleSlug) return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
    if (!Number.isInteger(number) || number < 1) {
      return NextResponse.json({ error: 'Número inválido' }, { status: 400 });
    }
    if (!customerName) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    if (!customerPhone) return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });

    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .select('*')
      .eq('slug', raffleSlug)
      .eq('status', 'published')
      .single();

    if (raffleError || !raffle) {
      return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 });
    }

    if (number > Number(raffle.total_numbers || 0)) {
      return NextResponse.json({ error: 'Número fuera de rango para esta rifa' }, { status: 400 });
    }

    const { data: existingReservation } = await supabase
      .from('raffle_reservations')
      .select('id, payment_status')
      .eq('raffle_id', raffle.id)
      .eq('number', number)
      .in('payment_status', ['pending', 'paid'])
      .maybeSingle();

    if (existingReservation) {
      return NextResponse.json({ error: 'Ese número ya está reservado o pagado' }, { status: 409 });
    }

    const reservationCode = `RIFA-${String(raffle.slug || raffle.id).toUpperCase()}-${number}-${randomDigits(4)}`;
    const reservationPayload = {
      raffle_id: raffle.id,
      raffle_slug: raffle.slug,
      raffle_title: raffle.title,
      number,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmailRaw || null,
      amount: Number(raffle.number_price || 0),
      payment_method: 'flow',
      payment_status: 'pending',
      reservation_code: reservationCode,
    };

    const { data: reservation, error: reservationError } = await supabase
      .from('raffle_reservations')
      .insert(reservationPayload)
      .select()
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: reservationError?.message || 'No se pudo crear la reserva' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const flowResult = await createFlowPayment({
      commerceOrder: reservationCode,
      subject: `Rifa ${raffle.title} - Número ${number}`,
      amount: Math.round(Number(raffle.number_price || 0)),
      email: customerEmail,
      urlConfirmation: `${baseUrl}/api/flow/confirm`,
      urlReturn: `${baseUrl}/api/flow/result`,
      optional: {
        commerceUser: `raffle:${reservation.id}`,
      },
    });

    await supabase
      .from('raffle_reservations')
      .update({
        flow_token: flowResult.token,
        flow_order: flowResult.flowOrder,
      })
      .eq('id', reservation.id);

    return NextResponse.json({
      paymentUrl: flowResult.url,
      reservationCode,
      reservationId: reservation.id,
      raffle: {
        slug: raffle.slug,
        title: raffle.title,
        number,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error creando reserva de rifa' },
      { status: 500 }
    );
  }
}
