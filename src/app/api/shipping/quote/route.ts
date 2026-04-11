import { NextResponse } from 'next/server';

// Starken API shipping quote - placeholder until API key is obtained
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_city, weight_kg, dimensions } = body;

    const apiKey = process.env.STARKEN_API_KEY;

    if (!apiKey || apiKey === 'xxxxxxxxxxxxxxxxxxxx') {
      // Starken API not yet configured — return placeholder
      return NextResponse.json({
        status: 'pending_configuration',
        message: 'El costo de envío será cotizado y confirmado por WhatsApp antes de procesar tu pedido.',
        quote: null,
      });
    }

    // When API key is available, this will call Starken
    const quoteResponse = await fetch('https://gateway.starken.cl/quote/cotizador', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({
        origen: 1, // Quillota/La Calera area code_dls — to be confirmed
        destino: destination_city,
        kilos: weight_kg || 5,
        alto: dimensions?.height || 20,
        ancho: dimensions?.width || 30,
        largo: dimensions?.length || 40,
        bulto: 'PAQUETE',
        entrega: 'DOMICILIO',
        servicio: 'NORMAL',
      }),
    });

    if (!quoteResponse.ok) {
      return NextResponse.json({
        status: 'error',
        message: 'No se pudo obtener la cotización. Contáctanos por WhatsApp.',
        quote: null,
      });
    }

    const quoteData = await quoteResponse.json();

    return NextResponse.json({
      status: 'success',
      quote: quoteData,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al cotizar envío' },
      { status: 500 }
    );
  }
}

// Get Starken cities list
export async function GET() {
  const apiKey = process.env.STARKEN_API_KEY;

  if (!apiKey || apiKey === 'xxxxxxxxxxxxxxxxxxxx') {
    return NextResponse.json({
      status: 'pending_configuration',
      message: 'Starken API no configurada',
      cities: [],
    });
  }

  try {
    const response = await fetch('https://gateway.starken.cl/agency/city', {
      headers: { apikey: apiKey },
    });

    if (!response.ok) {
      return NextResponse.json({ cities: [] }, { status: 502 });
    }

    const cities = await response.json();
    return NextResponse.json({ cities });
  } catch {
    return NextResponse.json({ cities: [] }, { status: 500 });
  }
}
