// src/app/api/ml/publish/route.ts
// Publica un producto de Supabase en Mercado Libre via API
// POST { ds_product_id: string }

import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { ds_product_id } = await req.json()

    if (!ds_product_id) {
      return Response.json({ error: 'ds_product_id requerido' }, { status: 400 })
    }

    const supabase = createClient()

    // Obtener producto con datos del proveedor
    const { data: product, error: productError } = await supabase
      .from('ds_products')
      .select('*, ds_supplier_products(*)')
      .eq('id', ds_product_id)
      .single()

    if (productError || !product) {
      return Response.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Obtener token de acceso mas reciente
    const { data: token, error: tokenError } = await supabase
      .from('ds_ml_tokens')
      .select('access_token, expires_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (tokenError || !token) {
      return Response.json(
        { error: 'No hay token de ML. Visita /api/ml/auth para autorizar.' },
        { status: 401 }
      )
    }

    // Verificar que el token no este expirado
    if (new Date(token.expires_at) < new Date()) {
      return Response.json(
        { error: 'Token expirado. Visita /api/ml/auth para re-autorizar.' },
        { status: 401 }
      )
    }

    const supplier = product.ds_supplier_products
    const images = (supplier?.images || []).map((url: string) => ({ source: url }))

    const mlBody = {
      title: product.title_cl,
      category_id: product.category_ml || 'MLC1648',
      price: product.price_ml,
      currency_id: 'CLP',
      available_quantity: product.stock_virtual || 99,
      buying_mode: 'buy_it_now',
      condition: product.condition || 'new',
      listing_type_id: 'gold_special',
      sale_terms: [
        { id: 'WARRANTY_TYPE', value_name: 'Garantia del vendedor' },
        { id: 'WARRANTY_TIME', value_name: '90 dias' },
      ],
      pictures: images.length > 0 ? images : [{ source: 'https://tenute.cl/logo.png' }],
      description: {
        plain_text: product.description_cl || product.title_cl,
      },
      shipping: {
        mode: 'me2',
        free_shipping: false,
      },
    }

    // Publicar en Mercado Libre
    const mlRes = await fetch('https://api.mercadolibre.com/items', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(mlBody),
    })

    const mlItem = await mlRes.json()

    if (!mlRes.ok) {
      console.error('Error ML API:', mlItem)
      return Response.json(
        { error: 'Error al publicar en ML', detail: mlItem },
        { status: mlRes.status }
      )
    }

    // Guardar publicacion en Supabase
    await supabase.from('ds_ml_listings').insert({
      ds_product_id,
      ml_item_id: mlItem.id,
      ml_status: mlItem.status,
      ml_permalink: mlItem.permalink,
      ml_price: mlItem.price,
      ml_stock: mlItem.available_quantity,
      published_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    })

    return Response.json({
      ok: true,
      ml_item_id: mlItem.id,
      status: mlItem.status,
      permalink: mlItem.permalink,
      title: mlItem.title,
      price: mlItem.price,
    })
  } catch (err) {
    console.error('Error publish ML:', err)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
