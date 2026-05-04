# Comparativa de precios vs competencia

Esta funcionalidad permite comparar el precio de Tenute frente a competidores por producto, actualizar precios de competencia vía scraping y aplicar un precio sugerido en el admin.

## Requisitos de base de datos

1. Ejecuta la migración:

- `supabase/migrations/20260502235000_competitor_pricing.sql`

2. Esta migración crea:

- `competitors`
- `product_competitor_links`
- `competitor_prices`

Además habilita RLS y agrega seed inicial para:

- Dimerc
- Officemax
- PC Factory
- Sodimac
- Mercado Libre
- Falabella

## Endpoints

### Admin

- `GET /api/admin/competitors`
  - Lista catálogo de competidores.

- `GET /api/admin/competitor-links?productId=...`
  - Lista enlaces configurados para un producto.

- `POST /api/admin/competitor-links`
  - Crea/edita/desactiva/elimina enlaces.
  - Acciones:
    - `action: "upsert"`
    - `action: "toggle"`
    - `action: "delete"`

- `GET /api/admin/competitor-prices?productId=...`
  - Devuelve último precio por enlace y el histórico de 30 días.

- `POST /api/admin/competitor-prices/refresh`
  - Refresca scraping.
  - Payload admitido:
    - `{ "productId": "..." }`
    - `{ "productIds": ["...", "..."] }`

- `PUT /api/admin/products/:id/price`
  - Actualiza rápidamente el precio de Tenute desde el panel comparativo.

### Cron

- `GET /api/cron/refresh-competitor-prices`
  - Recorre todos los enlaces activos y refresca precios.
  - Si existe `CRON_SECRET`, requiere `Authorization: Bearer <CRON_SECRET>`.

## Cron en Vercel

Se configuró en `vercel.json`:

- `0 10 * * *` (equivale a 06:00 en `-04`).

Path:

- `/api/cron/refresh-competitor-prices`

## Scraping: cómo agregar competidores/parsers

Archivos relevantes:

- `src/lib/scrapers/parser-domain.ts`
- `src/lib/scrapers/parser-generic.ts`
- `src/lib/scrapers/fetch-html.ts`

### Pasos para agregar un nuevo dominio

1. Agrega selector por defecto en `DOMAIN_PARSERS` dentro de `parser-domain.ts`.
2. Si el selector no basta, extiende lógica en `parser-generic.ts`.
3. Añade fixture HTML en:
   - `src/__tests__/fixtures/competitors/`
4. Añade/actualiza test en:
   - `src/__tests__/scraper-generic.test.ts`

## Configuración de selectores por producto

Desde el editor de producto:

1. Abre sección **Comparativa de precios**.
2. Click en **Agregar enlace**.
3. Selecciona competidor.
4. Ingresa URL del producto competidor.
5. Opcional: agrega selector CSS específico (`.price`, `meta[itemprop=price]`, etc.).

Si no defines selector, se usa heurística:

- meta `itemprop=price`
- meta `product:price:amount`
- JSON-LD `offers.price`
- regex de precio `$`

## Ejecución manual de refresh

Desde admin UI:

- Botón **Refrescar todos** en la comparativa del producto.

O vía HTTP:

- `POST /api/admin/competitor-prices/refresh` con `productId` o `productIds`.

O cron endpoint:

- `GET /api/cron/refresh-competitor-prices`

## Variables de entorno

- `SUPABASE_SERVICE_ROLE_KEY` (ya usada por APIs admin)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CRON_SECRET` (opcional, recomendado)
