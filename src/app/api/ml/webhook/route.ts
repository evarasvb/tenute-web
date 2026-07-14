// src/app/api/ml/webhook/route.ts
// Recibe notificaciones de Mercado Libre (ventas, cambios de estado, etc)
// ML llama a este endpoint automaticamente cuando hay actividad

import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('ML Webhook recibido:', JSON.stringify(body))

    // Solo procesar notificaciones de ordenes
    if (body.topic !== 'orders_v2') {
      return Response.json({ ok: true, ignored: true, topic: body.topic })
    }

    const supabase = createClient()

    // Obtener token para consultar la orden en ML
    const { data: token } = await supabase
      .from('ds_ml_tokens')
      .select('access_token')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (!token?.access_token) {
      console.error('No hay token de ML para procesar webhook')
      return Response.json({ ok: false, error: 'Sin token' }, { status: 200 })
    }

    // Obtener ID de la orden desde el recurso
    const resourceParts = (body.resource || '').split('/')
    const orderId = resourceParts[resourceParts.length - 1]

    if (!orderId) {
      return Response.json({ ok: true, ignored: true })
    }

    // Consultar detalle de la orden en ML
    const orderRes = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    })

    if (!orderRes.ok) {
      console.error('Error consultando orden ML:', orderId)
      return Response.json({ ok: true })
    }

    const order = await orderRes.json()

    // Buscar si ya existe la orden en Supabase
    const { data: existingOrder } = await supabase
      .from('ds_orders')
      .select('id')
      .eq('channel_order_id', String(order.id))
      .single()

    if (existingOrder) {
      // Actualizar estado si ya existe
      await supabase
        .from('ds_orders')
        .update({
          status: order.status,
          updated_at: new Date().toISOString(),
        })
        .eq('channel_order_id', String(order.id))

      return Response.json({ ok: true, action: 'updated', order_id: order.id })
    }

    // Crear nueva orden
    const firstItem = order.order_items?.[0]
    const mlItemId = firstItem?.item?.id

    // Buscar ds_product relacionado via ml_item_id
    const { data: listing } = await supabase
      .from('ds_ml_listings')
      .select('ds_product_id')
      .eq('ml_item_id', mlItemId)
      .single()

    await supabase.from('ds_orders').insert({
      channel: 'mercadolibre',
      channel_order_id: String(order.id),
      ds_product_id: listing?.ds_product_id || null,
      quantity: firstItem?.quantity || 1,
      sale_price: Math.round(order.total_amount || 0),
      cost_clp: 0,
      margin_clp: 0,
      buyer_name: order.buyer?.nickname || '',
      buyer_email: order.buyer?.email || '',
      shipping_address: order.shipping || null,
      status: order.status || 'pending',
    })

    console.log('Nueva orden registrada desde ML:', order.id)
    return Response.json({ ok: true, action: 'created', order_id: order.id })
  } catch (err) {
    console.error('Error en webhook ML:', err)
    // Siempre responder 200 a ML para que no reintente
    return Response.json({ ok: true })
  }
}

// ML tambien hace GET para verificar el endpoint
export async function GET() {
  return Response.json({ ok: true, service: 'Tenute ML Webhook', status: 'active' })
}
