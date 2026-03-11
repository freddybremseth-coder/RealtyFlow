-- Force re-creation of the RLS policy for user_settings to fix potential issues

DROP POLICY IF EXISTS "owner_select" ON public.user_settings;

CREATE POLICY "owner_select" ON public.user_settings
  FOR SELECT 
  USING (auth.uid() = user_id);
