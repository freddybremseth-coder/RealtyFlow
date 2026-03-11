ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS profile jsonb,
ADD COLUMN IF NOT EXISTS automation jsonb;