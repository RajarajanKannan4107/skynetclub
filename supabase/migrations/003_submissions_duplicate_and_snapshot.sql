-- =============================================================================
-- SKYNET CLUB MIGRATION 003: Submissions Duplicate Prevention & Schema Snapshot
-- Adds member_email, schema_snapshot, and allow_late_submissions
-- =============================================================================

-- Add allow_late_submissions flag to weekly_tasks if not present
ALTER TABLE public.weekly_tasks
ADD COLUMN IF NOT EXISTS allow_late_submissions BOOLEAN NOT NULL DEFAULT false;

-- Add member_email and schema_snapshot to task_submissions
ALTER TABLE public.task_submissions
ADD COLUMN IF NOT EXISTS member_email TEXT,
ADD COLUMN IF NOT EXISTS schema_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Populate member_email for any existing rows (fallback)
UPDATE public.task_submissions
SET member_email = 'member_' || id || '@srmist.edu.in'
WHERE member_email IS NULL;

ALTER TABLE public.task_submissions
ALTER COLUMN member_email SET NOT NULL;

-- Prevent duplicate submissions per task per email
ALTER TABLE public.task_submissions
DROP CONSTRAINT IF EXISTS uq_task_member_email;

ALTER TABLE public.task_submissions
ADD CONSTRAINT uq_task_member_email UNIQUE (task_id, member_email);

-- Index for member_email lookups
CREATE INDEX IF NOT EXISTS idx_task_submissions_email ON public.task_submissions(member_email);

-- Update RLS policy to allow late submissions when explicitly permitted by admin
DROP POLICY IF EXISTS "Public can submit to active published tasks" ON public.task_submissions;

CREATE POLICY "Public can submit to active published tasks"
  ON public.task_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.weekly_tasks
      WHERE weekly_tasks.id = task_submissions.task_id
        AND weekly_tasks.status = 'published'
        AND (weekly_tasks.deadline > now() OR weekly_tasks.allow_late_submissions = true)
    )
  );
