-- ============================================================
-- RIFAS: tablas para el sistema de sorteos / rifas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS rifas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','active','closed','completed')),
  total_tickets    INT  NOT NULL DEFAULT 100,
  ticket_price     INT  NOT NULL DEFAULT 0,
  max_per_person   INT,
  whatsapp_number  TEXT NOT NULL DEFAULT '',
  bank_info        TEXT,          -- texto libre con datos de transferencia
  draw_date        DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rifa_prizes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id     UUID NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  position    INT  NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rifa_tickets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id               UUID NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  ticket_number         INT  NOT NULL,
  buyer_name            TEXT,
  buyer_phone           TEXT,
  status                TEXT NOT NULL DEFAULT 'available'
                          CHECK (status IN ('available','pending','reserved','winner')),
  reserved_at           TIMESTAMPTZ,
  payment_confirmed_at  TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rifa_id, ticket_number)
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_rifa_tickets_rifa_id ON rifa_tickets(rifa_id);
CREATE INDEX IF NOT EXISTS idx_rifa_prizes_rifa_id  ON rifa_prizes(rifa_id);
CREATE INDEX IF NOT EXISTS idx_rifas_status         ON rifas(status);
