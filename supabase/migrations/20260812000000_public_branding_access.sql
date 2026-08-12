-- Allow public (anon + authenticated) read access to business_settings and branding storage
-- so company logo and business name are visible on the login screen.

-- 1. Update business_settings table SELECT policy
DROP POLICY IF EXISTS "All authenticated can read business_settings" ON public.business_settings;
DROP POLICY IF EXISTS "Public can read business_settings" ON public.business_settings;

CREATE POLICY "Public can read business_settings"
  ON public.business_settings FOR SELECT
  TO public
  USING (true);

GRANT SELECT ON TABLE public.business_settings TO anon, authenticated;

-- 2. Update storage.objects SELECT policy for branding bucket
DROP POLICY IF EXISTS "Authenticated users can read branding files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read branding files" ON storage.objects;

CREATE POLICY "Public can read branding files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'branding');
