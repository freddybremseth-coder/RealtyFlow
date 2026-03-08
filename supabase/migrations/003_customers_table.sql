-- ─────────────────────────────────────────────────────────────────────────────
-- Migrasjon: Opprett customers-tabellen for CRM
-- Kjør i: Supabase Dashboard → SQL Editor, eller via Supabase CLI:
--   supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists customers (
  id                   text primary key,
  name                 text not null,
  email                text not null,
  phone                text default '',
  nationality          text,
  source               text,
  status               text not null default 'ACTIVE',  -- CustomerStatus enum
  type                 text not null default 'BUYER',   -- CustomerType enum
  notes                text,
  budget               numeric,
  location             text,
  tags                 jsonb default '[]',
  lead_id              text,
  brand_id             text,
  total_value          numeric default 0,
  properties_interested jsonb default '[]',
  properties_bought    jsonb default '[]',
  emails               jsonb default '[]',
  created_at           timestamptz not null default now(),
  last_contact         timestamptz not null default now()
);

-- Indekser for filtrering
create index if not exists idx_customers_status   on customers (status);
create index if not exists idx_customers_brand_id on customers (brand_id);
create index if not exists idx_customers_lead_id  on customers (lead_id);

-- Row Level Security
alter table customers enable row level security;

-- Autentiserte brukere (innlogget rådgiver) kan gjøre alt
create policy if not exists "auth_all_customers"
  on customers
  for all
  to authenticated
  using (true)
  with check (true);

-- Service role (edge functions) kan INSERT uten RLS-begrensning
-- (service role bypasser RLS automatisk – ingen eksplisitt policy nødvendig)
