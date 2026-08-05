-- Create the branding storage bucket for logo uploads.
-- Public read access so employees can see the logo; only admins can upload/delete.

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: any authenticated user can read (SELECT) files in the branding bucket
CREATE POLICY "Authenticated users can read branding files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'branding');

-- Policy: only admins can upload (INSERT) files to the branding bucket
CREATE POLICY "Admins can upload branding files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branding'
  AND (SELECT public.is_admin())
);

-- Policy: only admins can update files in the branding bucket
CREATE POLICY "Admins can update branding files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'branding'
  AND (SELECT public.is_admin())
);

-- Policy: only admins can delete files from the branding bucket
CREATE POLICY "Admins can delete branding files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'branding'
  AND (SELECT public.is_admin())
);
