-- ─────────────────────────────────────────────────────────────────────────────
-- Migrasjon: Legg til webhook-kolonner i leads-tabellen
-- Kjør i: Supabase Dashboard → SQL Editor, eller via Supabase CLI:
--   supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Legg til manglende kolonner (kun hvis de ikke finnes)
alter table leads
  add column if not exists type       text,          -- 'real-estate' | 'ecommerce' | 'tech' | 'brand'
  add column if not exists message    text,          -- fritekst-melding fra kontaktskjema
  add column if not exists extra_data jsonb default '{}'; -- dynamiske felt (interests, readiness, company osv.)

-- 2. Indeks for rask filtrering på type og status
create index if not exists idx_leads_type   on leads (type);
create index if not exists idx_leads_status on leads (status);

-- 3. Tillat Supabase Edge Functions (service role) å INSERT uten RLS-begrensning
--    Service role bypasser RLS automatisk – ingen ekstern policy nødvendig.
--    Denne policyen gir anon-rolle mulighet til å INSERT via edge function,
--    slik at kontaktskjemaer på eksterne domener fungerer uten innlogging.
create policy if not exists "anon_insert_leads"
  on leads
  for insert
  to anon
  with check (true);
