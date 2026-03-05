
-- Sentralisert innholdstabell for Headless CMS-funksjonalitet

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- For pene URL-er som /magasin/min-fantastiske-artikkel
  
  content_markdown TEXT,
  
  category TEXT NOT NULL CHECK (category IN ('guide', 'market_pulse', 'blog_post', 'landing_page')),
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  
  -- Hvilken merkevare(r) skal dette publiseres til?
  -- Et array av brand-IDer som 'zeneco', 'pinoso', etc.
  target_brands TEXT[], 
  
  -- Referanse til brukeren som publiserte
  author_id UUID REFERENCES auth.users(id)
);

-- Funksjon for å automatisk oppdatere updated_at-stempelet
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger som kaller funksjonen over hver gang en rad oppdateres
CREATE TRIGGER on_articles_updated
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

