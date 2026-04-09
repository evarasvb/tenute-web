# Tenute Web

Tienda online para Tenute — artículos de oficina, insumos desechables y varios.  
Stack: **Next.js 14 · Supabase · Vercel · Tailwind CSS**

---

## Estructura

```
src/
├── app/          # App Router de Next.js
├── components/
│   ├── home/     # Hero, Categories, FeaturedProducts, WholesaleBlock
│   └── layout/   # Navbar, Footer
├── lib/
│   └── supabase.ts  # Cliente Supabase
└── types/        # Interfaces TypeScript
supabase-schema.sql   # Ejecutar en Supabase SQL Editor
```

---

## Setup local

```bash
npm install
cp .env.example .env.local   # Rellena con tus credenciales Supabase
npm run dev
```

## Variables de entorno

| Variable | Dónde encontrarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |

## Despliegue en Vercel

1. Conecta el repo en [vercel.com/new](https://vercel.com/new)
2. Agrega las variables de entorno en **Project Settings → Environment Variables**
3. Deploy automático en cada push a `main`

## Base de datos

1. Abre **Supabase → SQL Editor**
2. Copia y ejecuta el contenido de `supabase-schema.sql`

---

## Roadmap

- [x] Fase 1 — Home comercial estática + estructura base
- [ ] Fase 2 — Catálogo dinámico desde Supabase
- [ ] Fase 2 — Panel de carga de productos
- [ ] Fase 3 — Carrito y flujo de pedido
- [ ] Fase 3 — Integración de pago (Flow / MercadoPago)
