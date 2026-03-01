-- RealtyFlow – Full Database Schema
-- Kjør dette i Supabase SQL Editor

-- ─────────────────────────────────────────────
-- BRANDS
-- ─────────────────────────────────────────────
create table if not exists brands (
  id           text primary key,
  name         text not null,
  type         text,
  description  text,
  tone         text,
  logo         text,
  email        text,
  phone        text,
  phone2       text,
  website      text,
  visual_styles jsonb default '{}',
  integrations  jsonb default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────
create table if not exists leads (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text,
  phone            text,
  source           text,
  status           text not null default 'NEW',
  value            numeric default 0,
  sentiment        numeric default 50,
  urgency          numeric default 50,
  intent           numeric default 50,
  last_activity    text,
  summary          text,
  personality_type text,
  image_url        text,
  brand_id         text references brands(id),
  requirements     jsonb default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────────
-- VIEWING ITEMS
-- ─────────────────────────────────────────────
create table if not exists viewing_items (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid references leads(id) on delete cascade,
  property_title    text,
  property_location text,
  time              timestamptz,
  contact_person    text,
  contact_phone     text,
  status            text default 'Pending',
  notes             text,
  maps_url          text,
  created_at        timestamptz default now()
);

-- ─────────────────────────────────────────────
-- CALL LOGS
-- ─────────────────────────────────────────────
create table if not exists call_logs (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references leads(id) on delete cascade,
  date       date,
  time       time,
  duration   text,
  notes      text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- NURTURE STEPS
-- ─────────────────────────────────────────────
create table if not exists nurture_steps (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references leads(id) on delete cascade,
  day        integer,
  type       text,
  subject    text,
  status     text default 'Pending',
  content    text,
  sent_at    timestamptz,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- EMAIL MESSAGES
-- ─────────────────────────────────────────────
create table if not exists email_messages (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references leads(id) on delete cascade,
  date        date,
  from_email  text,
  subject     text,
  body        text,
  is_incoming boolean default true,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- PROPERTIES
-- ─────────────────────────────────────────────
create table if not exists properties (
  id            uuid primary key default gen_random_uuid(),
  external_id   text,
  title         text not null,
  price         numeric not null,
  location      text not null,
  region        text,
  property_type text,
  bedrooms      integer,
  bathrooms     integer,
  area          numeric,
  plot_size     numeric,
  terrace_size  numeric,
  image_url     text,
  gallery       text[] default '{}',
  status        text default 'Available',
  description   text,
  developer     text,
  commission    numeric,
  dropbox_url   text,
  website_url   text,
  agent_notes   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────
-- MARKETING CAMPAIGNS
-- ─────────────────────────────────────────────
create table if not exists marketing_campaigns (
  id         uuid primary key default gen_random_uuid(),
  date       date,
  brand_id   text references brands(id),
  headline   text,
  body       text,
  image_url  text,
  objective  text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- MARKET ANALYSES
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- SAVED VALUATIONS
-- ─────────────────────────────────────────────
create table if not exists saved_valuations (
  id            uuid primary key default gen_random_uuid(),
  brand_id      text references brands(id) not null,
  property_data jsonb not null default '{}',
  result        jsonb not null default '{}',
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────────
-- ADVISOR PROFILE
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────────────
create table if not exists settings (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid references auth.users(id) on delete cascade,
  market_pulse_enabled       boolean default true,
  brand_identity_guard       boolean default true,
  social_sync_enabled        boolean default false,
  lead_nurture_enabled       boolean default true,
  language                   text default 'no',
  created_at                 timestamptz default now(),
  updated_at                 timestamptz default now(),
  unique(user_id)
);

-- ─────────────────────────────────────────────
-- RLS (Row Level Security)
-- ─────────────────────────────────────────────
alter table brands              enable row level security;
alter table leads               enable row level security;
alter table viewing_items       enable row level security;
alter table call_logs           enable row level security;
alter table nurture_steps       enable row level security;
alter table email_messages      enable row level security;
alter table properties          enable row level security;
alter table marketing_campaigns enable row level security;
alter table market_analyses     enable row level security;
alter table saved_valuations    enable row level security;
alter table advisor_profile     enable row level security;
alter table settings            enable row level security;

-- Enkel policy: innloggede brukere får tilgang til alt
create policy "Authenticated users have full access" on brands              for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on leads               for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on viewing_items       for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on call_logs           for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on nurture_steps       for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on email_messages      for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on properties          for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on marketing_campaigns for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on market_analyses     for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on saved_valuations    for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on advisor_profile     for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on settings            for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Seed: Standard brands
-- ─────────────────────────────────────────────
insert into brands (id, name, type, description, tone) values
  ('soleada', 'Soleada', 'Agency', 'Eksklusiv eiendomsmegler på Costa Blanca', 'Profesjonell og varm'),
  ('zeneco',  'Zeneco',  'Eco-Living', 'Bærekraftige hjem og eco-living', 'Inspirerende og jordnær'),
  ('pinoso',  'Pinoso Eco Life', 'Development', 'Ny utbygging i Pinoso-regionen', 'Moderne og fremtidsrettet')
on conflict (id) do nothing;
