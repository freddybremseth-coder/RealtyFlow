-- ─────────────────────────────────────────────────────────────────────────────
-- Migrasjon: Opprett/oppdater leads-tabellen med alle kolonner og RLS-policyer
-- Kjør i: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Opprett tabellen hvis den ikke finnes (full schema)
create table if not exists leads (
  id            text primary key,
  name          text not null default '',
  email         text not null default '',
  phone         text default '',
  source        text default '',
  type          text default '',          -- 'real-estate' | 'ecommerce' | 'tech' | 'brand'
  brand_id      text default '',
  message       text default '',
  status        text not null default 'NEW',
  sentiment     numeric default 50,
  urgency       numeric default 50,
  intent        numeric default 50,
  value         numeric default 0,
  summary       text,
  requirements  jsonb default '{}',
  extra_data    jsonb default '{}',
  emails        jsonb default '[]',
  last_activity text default ''
);

-- 2. Legg til kolonner som mangler (trygt å kjøre flere ganger)
alter table leads add column if not exists type          text default '';
alter table leads add column if not exists message       text default '';
alter table leads add column if not exists extra_data    jsonb default '{}';
alter table leads add column if not exists emails        jsonb default '[]';
alter table leads add column if not exists sentiment     numeric default 50;
alter table leads add column if not exists urgency       numeric default 50;
alter table leads add column if not exists intent        numeric default 50;
alter table leads add column if not exists last_activity text default '';
alter table leads add column if not exists summary       text;
alter table leads add column if not exists requirements  jsonb default '{}';
alter table leads add column if not exists brand_id      text default '';
alter table leads add column if not exists value         numeric default 0;

-- 3. Indekser
create index if not exists idx_leads_brand_id on leads (brand_id);
create index if not exists idx_leads_status   on leads (status);
create index if not exists idx_leads_type     on leads (type);

-- 4. Aktiver RLS
alter table leads enable row level security;

-- 5. Fjern gamle policyer (i tilfelle de er feil satt opp)
drop policy if exists "anon_insert_leads" on public.leads;
drop policy if exists "anon_select_leads" on public.leads;
drop policy if exists "anon_update_leads" on public.leads;
drop policy if exists "anon_delete_leads" on public.leads;
drop policy if exists "auth_all_leads"    on public.leads;

-- 6. Anon (uinnlogget) kan lese og skrive — trengs for dashboard uten innlogging
create policy "anon_select_leads"
  on leads for select to anon using (true);

create policy "anon_insert_leads"
  on leads for insert to anon with check (true);

create policy "anon_update_leads"
  on leads for update to anon using (true) with check (true);

create policy "anon_delete_leads"
  on leads for delete to anon using (true);

-- 7. Autentiserte brukere har full tilgang
create policy "auth_all_leads"
  on leads for all to authenticated
  using (true) with check (true);
