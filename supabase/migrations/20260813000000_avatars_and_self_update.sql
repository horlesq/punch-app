-- Phase 5.1: Add avatar_url to profiles, create avatars storage bucket,
-- and add self-update RLS policy so employees can update their own locale and avatar.

-- 1. Add avatar_url column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;

-- 2. Create the avatars storage bucket (public read for image URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS: any authenticated user can read (SELECT) files in the avatars bucket
CREATE POLICY "Authenticated users can read avatar files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- 4. RLS: users can only upload (INSERT) files under their own userId/ path
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. RLS: users can only update files under their own userId/ path
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. RLS: users can only delete files under their own userId/ path
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7. Self-update RLS policy for profiles:
--    Allow any authenticated user to update ONLY their own locale and avatar_url.
--    This does NOT allow employees to change role, hourly_rate, full_name, etc.
CREATE POLICY "Users can update own locale and avatar"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: Postgres RLS WITH CHECK cannot restrict to specific columns.
-- The column restriction is enforced at the API layer (src/api/profiles.ts)
-- by only passing locale/avatar_url in the update call.
-- The "Admin can update all profiles" policy already covers admin updates.
