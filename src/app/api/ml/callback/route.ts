// src/app/api/ml/callback/route.ts
// Recibe el codigo OAuth de ML y guarda el access_token en Supabase

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  // El callback escribe el token del vendedor con la service_role. Exigir sesión
  // admin evita que un tercero autorice su propia cuenta de ML y secuestre las
  // publicaciones (el flujo se inicia desde /api/ml/auth, también protegido).
  if (!isAdminSession(req)) {
    return unauthorizedAdminResponse()
  }

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

    const supabase = createAdminClient()
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
