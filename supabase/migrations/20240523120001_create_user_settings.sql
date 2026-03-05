-- RealtyFlow: Cross-device user settings (API keys sync)
-- Run this in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_keys jsonb NOT NULL DEFAULT '{"anthropic":"","openai":"","gemini":""}',
  updated_at timestamptz DEFAULT now()
);

-- Row Level Security: each user can only access their own row
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "owner_insert" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_update" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);
