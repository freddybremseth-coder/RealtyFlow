-- ─────────────────────────────────────────────────────────────────────────────
-- Migrasjon: Splitt name-kolonnen til first_name og last_name i leads-tabellen
-- Kjør i: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Legg til nye kolonner
alter table leads add column if not exists first_name text default '';
alter table leads add column if not exists last_name  text default '';

-- 2. Fyll ut eksisterende rader basert på name-kolonnen
--    Siste ord = etternavn, resten = fornavn
update leads
set
  first_name = case
    when name like '% %' then regexp_replace(name, '\s+\S+$', '')
    else name
  end,
  last_name = case
    when name like '% %' then regexp_replace(name, '^.*\s+', '')
    else ''
  end
where first_name = '' or first_name is null;
