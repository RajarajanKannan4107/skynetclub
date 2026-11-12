-- =============================================================================
-- SKYNET CLUB STORAGE SETUP — MIGRATION 002
-- Dedicated Supabase Storage bucket for task submissions & project assets
-- =============================================================================

-- Create the dedicated task-submissions bucket (private: public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-submissions',
  'task-submissions',
  false, -- private bucket: submissions are sensitive and accessible only to admins
  15728640, -- 15MB max file limit per upload
  ARRAY[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'application/json'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640;

-- Create public project thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-thumbnails',
  'project-thumbnails',
  true, -- public bucket for public project cards
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- -----------------------------------------------------------------------------
-- STORAGE RLS POLICIES FOR task-submissions
-- -----------------------------------------------------------------------------

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view submission files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage submission files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view project thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage project thumbnails" ON storage.objects;

-- Only admins can download/view submission files
CREATE POLICY "Admins can view submission files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'task-submissions'
    AND public.is_admin()
  );

-- Admins can update/delete submission files
CREATE POLICY "Admins can manage submission files"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'task-submissions'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'task-submissions'
    AND public.is_admin()
  );

-- Project thumbnails are publicly viewable
CREATE POLICY "Public can view project thumbnails"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'project-thumbnails');

-- Only admins can upload/manage project thumbnails
CREATE POLICY "Admins can manage project thumbnails"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'project-thumbnails'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'project-thumbnails'
    AND public.is_admin()
  );
