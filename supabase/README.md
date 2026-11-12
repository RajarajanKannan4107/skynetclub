# SkyNet Supabase Setup & Migration Guide

This directory contains the production-ready PostgreSQL schema, Row Level Security (RLS) policies, Storage configurations, and seed data for the SkyNet website.

---

## Migration Files

1. **`migrations/001_initial_schema.sql`**
   - Tables: `profiles`, `admin_roles`, `weekly_tasks`, `task_submissions`, `projects`.
   - Extensions: `uuid-ossp`, `pgcrypto`.
   - Security: RLS enabled on all tables with explicit policies.
   - Triggers:
     - Automatic user profile creation on `auth.users` signup.
     - Automatic `updated_at` timestamps on `weekly_tasks`.
   - Helper function: `public.is_admin()` (`SECURITY DEFINER` for fast, recursion-free admin role checks).

2. **`migrations/002_storage_setup.sql`**
   - Bucket: `task-submissions` (Private, 15MB file size limit, PDF/ZIP/Images/Text/JSON).
   - Bucket: `project-thumbnails` (Public, 5MB file size limit).
   - Storage RLS: Public cannot read submission files. Only admins can access and generate signed URLs for submitted member files.

3. **`migrations/003_submissions_duplicate_and_snapshot.sql`**
   - Adds `allow_late_submissions` to `weekly_tasks`.
   - Adds mandatory `member_email` and immutable `schema_snapshot` to `task_submissions`.
   - Adds `uq_task_member_email` unique constraint `(task_id, member_email)` for duplicate prevention.
   - Updates RLS insert policy to respect `allow_late_submissions`.

4. **`seed.sql`**
   - Seeded sample published weekly task containing all **9 dynamic field types**:
     - `short_text`
     - `long_text`
     - `url`
     - `email`
     - `number`
     - `date`
     - `dropdown`
     - `checkbox`
     - `file_upload`
   - Seeded sample club project showcase ("Coming Soon").
   - Admin account role assignment SQL instructions.

---

## How to Apply Migrations

### Option A: Via Supabase Dashboard (Recommended)
1. Log in to [https://app.supabase.com](https://app.supabase.com) and open your project.
2. Navigate to **SQL Editor** in the left sidebar.
3. Open `migrations/001_initial_schema.sql`, paste the contents into the editor, and click **Run**.
4. Open `migrations/002_storage_setup.sql`, paste, and click **Run**.
5. (Optional) Run `seed.sql` to populate sample task and project data.

### Option B: Via Supabase CLI
```bash
supabase db push
```

---

## Provisioning an Administrator

1. Create a user via Supabase Dashboard -> **Authentication** -> **Users** -> **Add user**.
2. Copy the newly created User UUID.
3. In the SQL Editor, run:
```sql
INSERT INTO public.admin_roles (user_id, role)
VALUES ('<PASTE-USER-UUID-HERE>', 'admin')
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.profiles
SET role = 'admin'
WHERE id = '<PASTE-USER-UUID-HERE>';
```
