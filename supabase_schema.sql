-- ═══════════════════════════════════════════════════════════════════════════
-- RealtyFlow Super App — Komplett Supabase-schema
-- Kjør dette i Supabase SQL Editor: https://supabase.com/dashboard/project/kkswlrpvpyczngemphse/sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. BRANDS / SELSKAPER
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists brands (
  id            text primary key,
  name          text not null,
  type          text,
  description   text,
  tone          text,
  logo          text,
  email         text,
  phone         text,
  phone2        text,
  website       text,
  visual_styles jsonb default '{}',
  integrations  jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. LEADS / PIPELINE
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists leads (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text,
  phone            text,
  source           text,
  status           text not null default 'NEW',    -- NEW|QUALIFIED|VIEWING|NEGOTIATION|WON|LOST
  value            numeric default 0,
  sentiment        numeric default 50,
  urgency          numeric default 50,
  intent           numeric default 50,
  last_activity    text,
  summary          text,
  personality_type text,
  image_url        text,
  brand_id         text references brands(id),
  requirements     jsonb default '{}',             -- { budget, location, propertyType, bedrooms }
  emails           jsonb default '[]',             -- EmailMessage[]
  viewing_plan     jsonb default '[]',             -- ViewingItem[]
  call_logs        jsonb default '[]',             -- CallLog[]
  nurture_steps    jsonb default '[]',             -- NurtureStep[]
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. CUSTOMERS / KUNDEKORT (CRM)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists customers (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  email                text,
  phone                text,
  nationality          text,
  source               text,
  status               text not null default 'ACTIVE',  -- ACTIVE|INACTIVE|VIP|CLOSED
  type                 text not null default 'BUYER',   -- BUYER|SELLER|INVESTOR|RENTER
  notes                text,
  image_url            text,
  brand_id             text references brands(id),
  lead_id              uuid references leads(id),
  properties_interested text[] default '{}',
  properties_bought    text[] default '{}',
  budget               numeric,
  location             text,
  tags                 text[] default '{}',
  total_value          numeric default 0,
  last_contact         timestamptz default now(),
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. APPOINTMENTS / KALENDER
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists appointments (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  type           text not null default 'VIEWING',   -- VIEWING|MEETING|CALL|VALUATION|SIGNING|OTHER
  date           date not null,
  time           time not null,
  duration       integer default 60,               -- minutter
  location       text,
  notes          text,
  status         text not null default 'PENDING',  -- CONFIRMED|PENDING|COMPLETED|CANCELLED
  lead_id        uuid references leads(id),
  customer_id    uuid references customers(id),
  property_id    uuid,
  brand_id       text references brands(id),
  contact_name   text,
  contact_phone  text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. MARKETING TASKS / MARKEDSOPPGAVER
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
  tags       text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. PROPERTIES / BOLIGBASE
--    Alle felt fra RedSP XML-feed (1mars2026-extended.xml)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists properties (
  id                    uuid primary key default gen_random_uuid(),

  -- Identifikasjon (fra XML)
  redsp_id              text,                         -- <id>2964-115-10-115</id>
  ref                   text unique,                  -- <ref>N9603</ref>  ← unikt nøkkel for upsert
  date_updated          timestamptz,                  -- <date>

  -- Pris og salgsbetingelser
  price                 numeric not null default 0,   -- <price>
  currency              text default 'EUR',           -- <currency>
  price_freq            text default 'sale',          -- <price_freq> sale|rent
  part_ownership        boolean default false,        -- <part_ownership>
  leasehold             boolean default false,        -- <leasehold>

  -- Type og status
  property_type         text,                         -- <type> Villa|Apartment|Townhouse|etc.
  new_build             boolean default false,        -- <new_build>
  status                text default 'Available',

  -- Lokasjon
  town                  text,                         -- <town>
  province              text,                         -- <province>
  costa                 text,                         -- <costa>
  country               text default 'Spain',         -- <country>
  latitude              numeric(12,9),                -- <location><latitude>
  longitude             numeric(12,9),                -- <location><longitude>
  location_detail       text,                         -- <location_detail> (urbanización/neighborhood)
  postal_code           text,                         -- <postal_code>

  -- Boligdetaljer
  bedrooms              integer default 0,            -- <beds>
  bathrooms             integer default 0,            -- <baths>
  pool                  boolean default false,        -- <pool>

  -- Areal (m²)
  built_m2              numeric default 0,            -- <surface_area><built>
  plot_m2               numeric default 0,            -- <surface_area><plot>
  terrace_m2            numeric default 0,            -- <terrace_m2>
  solarium_m2           numeric default 0,            -- <solarium_area_m2>
  usable_m2             numeric default 0,            -- <usable_living_area_m2>

  -- Avstand
  distance_to_beach_m   integer,                      -- <distance_to_beach_m>

  -- Energimerking
  energy_consumption    text,                         -- <energy_rating><consumption> A–G
  energy_emissions      text,                         -- <energy_rating><emissions> A–G

  -- Titler (flerspråklig)
  title_no              text,                         -- <title><no>
  title_en              text,                         -- <title><en>
  title_es              text,                         -- <title><es>
  title_de              text,                         -- <title><de>
  title_fr              text,                         -- <title><fr>
  title_ru              text,                         -- <title><ru>

  -- Beskrivelser (flerspråklig)
  desc_no               text,                         -- <desc><no>
  desc_en               text,                         -- <desc><en>
  desc_es               text,                         -- <desc><es>
  desc_de               text,                         -- <desc><de>
  desc_fr               text,                         -- <desc><fr>
  desc_ru               text,                         -- <desc><ru>

  -- Features / fasiliteter
  features              text[] default '{}',          -- <features><feature>Private Pool</feature>...

  -- Bilder
  image_url             text,                         -- første bilde (convenience)
  gallery               text[] default '{}',          -- alle bilder
  floorplan_urls        text[] default '{}',          -- bilder tagget som floorplan

  -- Agent/megler
  developer             text,                         -- <developer> / <complex> / <urbanization>
  agent_notes           text,
  commission            numeric,
  brand_id              text references brands(id),

  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Rask søk på ref og sted
create index if not exists properties_ref_idx      on properties(ref);
create index if not exists properties_town_idx     on properties(town);
create index if not exists properties_type_idx     on properties(property_type);
create index if not exists properties_price_idx    on properties(price);
create index if not exists properties_newbuild_idx on properties(new_build);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. MARKETING CAMPAIGNS / MARKEDSKAMPANJER
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists marketing_campaigns (
  id         uuid primary key default gen_random_uuid(),
  date       date,
  brand_id   text references brands(id),
  headline   text,
  body       text,
  image_url  text,
  objective  text,
  platform   text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. MARKET ANALYSES / MARKEDSANALYSER
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists market_analyses (
  id         uuid primary key default gen_random_uuid(),
  date       date,
  location   text,
  theme      text,
  title      text,
  content    text,
  sources    jsonb default '[]',
  brand_id   text references brands(id),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 9. SAVED VALUATIONS / VERDIVURDERINGER
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists saved_valuations (
  id            uuid primary key default gen_random_uuid(),
  brand_id      text references brands(id) not null,
  property_data jsonb not null default '{}',
  result        jsonb not null default '{}',
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 10. ADVISOR PROFILE / RÅDGIVERPROFIL
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists advisor_profile (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  image_url          text,
  phone              text,
  phone2             text,
  location           text,
  secondary_location text,
  signature          text,
  expertise          text[] default '{}',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 11. SETTINGS / INNSTILLINGER
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists settings (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade unique,
  market_pulse_enabled   boolean default true,
  brand_identity_guard   boolean default true,
  social_sync_enabled    boolean default false,
  lead_nurture_enabled   boolean default true,
  language               text default 'no',
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════
alter table brands             enable row level security;
alter table leads              enable row level security;
alter table customers          enable row level security;
alter table appointments       enable row level security;
alter table marketing_tasks    enable row level security;
alter table properties         enable row level security;
alter table marketing_campaigns enable row level security;
alter table market_analyses    enable row level security;
alter table saved_valuations   enable row level security;
alter table advisor_profile    enable row level security;
alter table settings           enable row level security;

-- Alle innloggede brukere har full tilgang (enkelt opplegg for solo-megler)
do $$ begin
  create policy "auth_full_brands"              on brands              for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_full_leads"               on leads               for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_full_customers"           on customers           for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_full_appointments"        on appointments        for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_full_marketing_tasks"     on marketing_tasks     for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_full_properties"          on properties          for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_full_marketing_campaigns" on marketing_campaigns for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_full_market_analyses"     on market_analyses     for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_full_saved_valuations"    on saved_valuations    for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_full_advisor_profile"     on advisor_profile     for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "auth_settings"                 on settings            for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA — standard selskaper
-- ═══════════════════════════════════════════════════════════════════════════
insert into brands (id, name, type, description, tone, email, phone, website) values
  ('soleada',       'Soleada.no',       'Agency',    'Luxury International Agency',                              'Professional, Trustworthy, Exclusive',    'info@soleada.no',        '+47 000 00 000', 'https://soleada.no'),
  ('zeneco',        'Zen Eco Homes',    'Utbygger',  'Spesialist på nybygg og moderne kvalitetshjem i Spania.',  'Sleek, Innovative, Precise, Trustworthy', 'freddy@zenecohomes.com', '+47 960099965',  'https://zenecohomes.com'),
  ('pinosoecolife', 'Pinosoecolife.com','Eco-Living', 'Autentisk økoliv i innlandet – fincaer i Pinoso.',        'Authentic, Natural, Sustainable',         'info@pinosoecolife.com', '+47 960099965',  'https://pinosoecolife.com')
on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  website     = excluded.website,
  updated_at  = now();
