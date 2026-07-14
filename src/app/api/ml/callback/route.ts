// src/app/api/ml/callback/route.ts
// Recibe el codigo OAuth de ML y guarda el access_token en Supabase

import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return Response.json(
      { error: error || 'No se recibio codigo de autorizacion' },
      { status: 400 }
    )
  }

  try {
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ML_APP_ID!,
        client_secret: process.env.ML_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.ML_REDIRECT_URI!,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return Response.json(
        { error: 'Error al obtener token', detail: tokenData },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    await supabase.from('ds_ml_tokens').upsert(
      {
        ml_user_id: String(tokenData.user_id),
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'ml_user_id' }
    )

    return Response.json({
      ok: true,
      message: 'App autorizada correctamente',
      ml_user_id: tokenData.user_id,
      expires_at: expiresAt,
    })
  } catch (err) {
    console.error('Error callback ML:', err)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
