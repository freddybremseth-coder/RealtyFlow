-- ═══════════════════════════════════════════════════════════════════════════
-- RealtyFlow — Delta-migrering
-- Kjør dette i Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kkswlrpvpyczngemphse/sql/new
--
-- Disse tabellene eksisterer allerede: brands, leads, properties, settings,
-- advisor_profile, market_analyses, marketing_campaigns, saved_valuations,
-- viewing_items, call_logs, nurture_steps, email_messages
--
-- Dette scriptet:
--   1. Legger til nye kolonner i properties (fra RedSP XML-feed)
--   2. Oppretter customers-tabellen (CRM)
--   3. Oppretter appointments-tabellen (Kalender)
--   4. Oppretter marketing_tasks-tabellen (Markedsoppgaver)
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────
-- 1. PROPERTIES — nye kolonner fra RedSP XML-feed
--    (bruker ALTER TABLE ADD COLUMN IF NOT EXISTS for trygg re-kjøring)
-- ─────────────────────────────────────────────────────────────────────────

alter table properties
  add column if not exists redsp_id              text,
  add column if not exists ref                   text,
  add column if not exists date_updated          timestamptz,
  add column if not exists currency              text         default 'EUR',
  add column if not exists price_freq            text         default 'sale',
  add column if not exists part_ownership        boolean      default false,
  add column if not exists leasehold             boolean      default false,
  add column if not exists new_build             boolean      default false,
  add column if not exists town                  text,
  add column if not exists province              text,
  add column if not exists costa                 text,
  add column if not exists country               text         default 'Spain',
  add column if not exists latitude              numeric(12,9),
  add column if not exists longitude             numeric(12,9),
  add column if not exists location_detail       text,
  add column if not exists postal_code           text,
  add column if not exists pool                  boolean      default false,
  add column if not exists built_m2              numeric      default 0,
  add column if not exists plot_m2               numeric      default 0,
  add column if not exists terrace_m2            numeric      default 0,
  add column if not exists solarium_m2           numeric      default 0,
  add column if not exists usable_m2             numeric      default 0,
  add column if not exists distance_to_beach_m   integer,
  add column if not exists energy_consumption    text,
  add column if not exists energy_emissions      text,
  -- Flerspråklige titler
  add column if not exists title_no              text,
  add column if not exists title_en              text,
  add column if not exists title_es              text,
  add column if not exists title_de              text,
  add column if not exists title_fr              text,
  add column if not exists title_ru              text,
  -- Flerspråklige beskrivelser
  add column if not exists desc_no               text,
  add column if not exists desc_en               text,
  add column if not exists desc_es               text,
  add column if not exists desc_de               text,
  add column if not exists desc_fr               text,
  add column if not exists desc_ru               text,
  -- Features og bilder
  add column if not exists features              text[]       default '{}',
  add column if not exists image_url             text,
  add column if not exists gallery               text[]       default '{}',
  add column if not exists floorplan_urls        text[]       default '{}';

-- Unikt indeks på ref for upsert
create unique index if not exists properties_ref_unique on properties(ref) where ref is not null;

-- Søkeindekser
create index if not exists properties_ref_idx      on properties(ref);
create index if not exists properties_town_idx     on properties(town);
create index if not exists properties_type_idx     on properties(property_type);
create index if not exists properties_price_idx    on properties(price);
create index if not exists properties_newbuild_idx on properties(new_build);


-- ─────────────────────────────────────────────────────────────────────────
-- 2. CUSTOMERS / KUNDEKORT (CRM)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists customers (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  email                 text,
  phone                 text,
  nationality           text,
  source                text,
  status                text not null default 'ACTIVE',  -- ACTIVE|INACTIVE|VIP|CLOSED
  type                  text not null default 'BUYER',   -- BUYER|SELLER|INVESTOR|RENTER
  notes                 text,
  image_url             text,
  brand_id              text references brands(id),
  lead_id               uuid references leads(id),
  properties_interested text[]       default '{}',
  properties_bought     text[]       default '{}',
  budget                numeric,
  location              text,
  tags                  text[]       default '{}',
  total_value           numeric      default 0,
  last_contact          timestamptz  default now(),
  created_at            timestamptz  default now(),
  updated_at            timestamptz  default now()
);

alter table customers enable row level security;

do $$ begin
  create policy "auth_full_customers" on customers for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;


-- ─────────────────────────────────────────────────────────────────────────
-- 3. APPOINTMENTS / KALENDER
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists appointments (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  type          text not null default 'VIEWING',   -- VIEWING|MEETING|CALL|VALUATION|SIGNING|OTHER
  date          date not null,
  time          time not null,
  duration      integer      default 60,           -- minutter
  location      text,
  notes         text,
  status        text not null default 'PENDING',   -- CONFIRMED|PENDING|COMPLETED|CANCELLED
  lead_id       uuid references leads(id),
  customer_id   uuid references customers(id),
  property_id   uuid,
  brand_id      text references brands(id),
  contact_name  text,
  contact_phone text,
  created_at    timestamptz  default now(),
  updated_at    timestamptz  default now()
);

alter table appointments enable row level security;

do $$ begin
  create policy "auth_full_appointments" on appointments for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;


-- ─────────────────────────────────────────────────────────────────────────
-- 4. MARKETING_TASKS / MARKEDSOPPGAVER
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists marketing_tasks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text,
  platform   text,                                 -- Instagram|Facebook|LinkedIn|TikTok|E-post|YouTube|Nettside
  status     text not null default 'PENDING',      -- PENDING|IN_PROGRESS|REVIEW|DONE
  priority   text not null default 'MEDIUM',       -- LOW|MEDIUM|HIGH
  due_date   date,
  brand_id   text references brands(id),
  tags       text[]       default '{}',
  created_at timestamptz  default now(),
  updated_at timestamptz  default now()
);

alter table marketing_tasks enable row level security;

do $$ begin
  create policy "auth_full_marketing_tasks" on marketing_tasks for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;


-- ─────────────────────────────────────────────────────────────────────────
-- 5. Oppdater seed-data for brands (legg til Pinosoecolife.com)
-- ─────────────────────────────────────────────────────────────────────────

insert into brands (id, name, type, description, tone, email, phone, website) values
  ('pinosoecolife', 'Pinosoecolife.com', 'Eco-Living',
   'Autentisk økoliv i innlandet – bærekraftige fincaer og tomter i Pinoso-regionen.',
   'Authentic, Natural, Sustainable, Community',
   'info@pinosoecolife.com', '+47 960099965', 'https://pinosoecolife.com')
on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  website     = excluded.website,
  updated_at  = now();
