// src/app/api/ml/auth/route.ts
// Inicia el flujo OAuth con Mercado Libre
// Visita (como admin autenticado): https://tenute.cl/api/ml/auth para autorizar la app

import { NextRequest } from 'next/server'
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // Solo un admin autenticado puede iniciar el enlace OAuth con la cuenta de ML.
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse()
  }

  const appId = process.env.ML_APP_ID
  const redirectUri = process.env.ML_REDIRECT_URI

  if (!appId || !redirectUri) {
    return Response.json(
      { error: 'ML_APP_ID o ML_REDIRECT_URI no configurados en variables de entorno' },
      { status: 500 }
    )
  }

  const mlAuthUrl = `https://auth.mercadolibre.cl/authorization?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}`

  return Response.redirect(mlAuthUrl)
}
