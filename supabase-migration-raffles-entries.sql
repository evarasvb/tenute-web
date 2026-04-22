-- Raffle entries / reservations for paid number purchases
create table if not exists raffle_reservations (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id) on delete cascade,
  raffle_slug text not null,
  raffle_title text not null,
  number integer not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  amount integer not null default 0,
  payment_method text not null default 'flow',
  payment_status text not null default 'pending',
  reservation_code text not null unique,
  flow_token text,
  flow_order bigint,
  payment_id text,
  winner boolean not null default false,
  drawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint raffle_reservations_payment_status_check
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled'))
);

create unique index if not exists raffle_reservations_unique_raffle_number_active
  on raffle_reservations (raffle_id, number)
  where payment_status in ('pending', 'paid');

create index if not exists raffle_reservations_raffle_id_idx
  on raffle_reservations (raffle_id, created_at desc);

create index if not exists raffle_reservations_payment_status_idx
  on raffle_reservations (payment_status);

create or replace function set_raffle_reservations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_raffle_reservations_updated_at on raffle_reservations;
create trigger trg_raffle_reservations_updated_at
before update on raffle_reservations
for each row
execute function set_raffle_reservations_updated_at();
