-- =============================================================================
-- SKYNET CLUB DATABASE SCHEMA — MIGRATION 001
-- PostgreSQL schema for Supabase
-- Tables: profiles, admin_roles, weekly_tasks, task_submissions, projects
-- Security: Row Level Security (RLS) enabled on all tables
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Extends auth.users with club-specific profile metadata
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'lead')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for profiles email lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- -----------------------------------------------------------------------------
-- 2. ADMIN ROLES TABLE
-- Explicit mapping of authorized admin user UUIDs for RBAC
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_admin_roles_user UNIQUE (user_id)
);

-- Index for fast user_id authorization lookups
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);

-- -----------------------------------------------------------------------------
-- HELPER FUNCTION: is_admin()
-- Evaluates whether the current authenticated JWT belongs to an admin
-- SECURITY DEFINER prevents infinite recursion in RLS policies
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- 3. WEEKLY TASKS TABLE
-- Admin-controlled task assignments with dynamic JSONB submission schema
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_domain TEXT NOT NULL CHECK (
    assigned_domain IN (
      'Web Development',
      'AI/ML',
      'Competitive Programming',
      'Content & Design',
      'PR & Marketing',
      'All'
    )
  ),
  week_number INTEGER NOT NULL CHECK (week_number > 0),
  deadline TIMESTAMPTZ NOT NULL,
  allow_late_submissions BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  submission_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_status ON public.weekly_tasks(status);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_assigned_domain ON public.weekly_tasks(assigned_domain);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_deadline ON public.weekly_tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_week_number ON public.weekly_tasks(week_number);

-- -----------------------------------------------------------------------------
-- 4. TASK SUBMISSIONS TABLE
-- Member task submissions with mandatory identification & dynamic answers (JSONB)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.weekly_tasks(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_email TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL CHECK (year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')),
  section TEXT NOT NULL,
  club_domain TEXT NOT NULL CHECK (
    club_domain IN (
      'Web Development',
      'AI/ML',
      'Competitive Programming',
      'Content & Design',
      'PR & Marketing'
    )
  ),
  submission_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submission_status TEXT NOT NULL DEFAULT 'submitted' CHECK (
    submission_status IN ('submitted', 'under_review', 'accepted', 'rejected', 'archived')
  ),
  CONSTRAINT uq_task_member_email UNIQUE (task_id, member_email)
);

-- Indexes for submissions
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON public.task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_email ON public.task_submissions(member_email);
CREATE INDEX IF NOT EXISTS idx_task_submissions_club_domain ON public.task_submissions(club_domain);
CREATE INDEX IF NOT EXISTS idx_task_submissions_submitted_at ON public.task_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON public.task_submissions(submission_status);

-- -----------------------------------------------------------------------------
-- 5. PROJECTS TABLE
-- Club technical projects showcase
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  github_url TEXT,
  demo_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'coming_soon' CHECK (
    status IN ('coming_soon', 'in_progress', 'completed', 'archived')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- =============================================================================
-- TRIGGERS & AUTOMATION
-- =============================================================================

-- Auto-update updated_at timestamp on weekly_tasks
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_weekly_tasks_updated_at ON public.weekly_tasks;
CREATE TRIGGER trigger_weekly_tasks_updated_at
  BEFORE UPDATE ON public.weekly_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PROFILES POLICIES
-- -----------------------------------------------------------------------------
-- Users can view their own profile; admins can view all profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can update their own profile; admins can update any profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- ADMIN ROLES POLICIES
-- -----------------------------------------------------------------------------
-- Only authorized admins can view admin role mappings
CREATE POLICY "Admins can view admin_roles"
  ON public.admin_roles
  FOR SELECT
  USING (public.is_admin());

-- Only admins can manage admin roles
CREATE POLICY "Admins can manage admin_roles"
  ON public.admin_roles
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- WEEKLY TASKS POLICIES
-- -----------------------------------------------------------------------------
-- Anyone can view published tasks; admins can view all tasks (including drafts)
CREATE POLICY "Public can view published tasks"
  ON public.weekly_tasks
  FOR SELECT
  USING (status = 'published' OR public.is_admin());

-- Only admins can create tasks
CREATE POLICY "Admins can insert tasks"
  ON public.weekly_tasks
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update tasks
CREATE POLICY "Admins can update tasks"
  ON public.weekly_tasks
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete tasks
CREATE POLICY "Admins can delete tasks"
  ON public.weekly_tasks
  FOR DELETE
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TASK SUBMISSIONS POLICIES
-- -----------------------------------------------------------------------------
-- Anyone (members/public) can insert submissions for published tasks
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

-- Only admins can read submissions (members cannot see other members' work)
CREATE POLICY "Admins can view all submissions"
  ON public.task_submissions
  FOR SELECT
  USING (public.is_admin());

-- Only admins can update submission status (reviewing/grading)
CREATE POLICY "Admins can update submissions"
  ON public.task_submissions
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete submissions
CREATE POLICY "Admins can delete submissions"
  ON public.task_submissions
  FOR DELETE
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- PROJECTS POLICIES
-- -----------------------------------------------------------------------------
-- Anyone can view projects that are not archived
CREATE POLICY "Public can view projects"
  ON public.projects
  FOR SELECT
  USING (status != 'archived' OR public.is_admin());

-- Only admins can manage projects
CREATE POLICY "Admins can insert projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update projects"
  ON public.projects
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete projects"
  ON public.projects
  FOR DELETE
  USING (public.is_admin());
