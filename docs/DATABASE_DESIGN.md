# SkyNet Club Website — Database Design

**Version:** 1.0 (Planning)  
**Database:** Supabase PostgreSQL  
**Status:** Awaiting Approval

---

## 1. Tables Overview

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | Extended user data for Supabase Auth users | ✅ Enabled |
| `admin_roles` | Maps user UUIDs to admin role | ✅ Enabled |
| `weekly_tasks` | Tasks created by admins | ✅ Enabled |
| `task_submissions` | Member form submissions | ✅ Enabled |
| `projects` | Club project entries | ✅ Enabled |
| `gallery_items` | Fixed 10-slot gallery configuration | ✅ Enabled |

---

## 2. Table Definitions

### 2.1 `profiles`

Extends `auth.users`. Created automatically via trigger when a new user signs up.

```sql
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- Users can read and update their own profile only.
- Admins can read all profiles.

---

### 2.2 `admin_roles`

Tracks which authenticated users have admin privileges.

```sql
CREATE TABLE public.admin_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES auth.users(id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
```

**Notes:**
- Rows are inserted manually (via Supabase dashboard or seed script) for authorized email addresses.
- The Express `adminMiddleware` queries this table using the service-role client after verifying the JWT.

**RLS Policies:**
- No direct public or member access.
- Only service-role key (server-side) may read this table.

---

### 2.3 `weekly_tasks`

Tasks created by administrators.

```sql
CREATE TABLE public.weekly_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  domain       TEXT NOT NULL
                 CHECK (domain IN (
                   'Web Development',
                   'AI/ML',
                   'Competitive Programming',
                   'Content & Design',
                   'PR & Marketing',
                   'All'
                 )),
  deadline     TIMESTAMPTZ NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID NOT NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Field Notes:**
- `domain = 'All'` indicates the task is assigned to every domain.
- `is_published = false` means the task is a draft (hidden from public).
- A task is considered "expired" when `deadline < now()`. Computed at query time; no extra column needed.

**RLS Policies:**
- **Public (anon):** `SELECT` where `is_published = true`.
- **Admin:** Full `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

**Indexes:**
```sql
CREATE INDEX idx_weekly_tasks_domain ON weekly_tasks(domain);
CREATE INDEX idx_weekly_tasks_deadline ON weekly_tasks(deadline);
CREATE INDEX idx_weekly_tasks_published ON weekly_tasks(is_published);
```

---

### 2.4 `task_submissions`

Member responses to tasks.

```sql
CREATE TABLE public.task_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          UUID NOT NULL REFERENCES public.weekly_tasks(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  department       TEXT NOT NULL,
  year             TEXT NOT NULL
                     CHECK (year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')),
  section          TEXT NOT NULL,
  club_domain      TEXT NOT NULL
                     CHECK (club_domain IN (
                       'Web Development',
                       'AI/ML',
                       'Competitive Programming',
                       'Content & Design',
                       'PR & Marketing'
                     )),
  submission_url   TEXT,
  response_text    TEXT,
  remarks          TEXT,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitter_email  TEXT NOT NULL,

  -- Prevent duplicate submissions per task per email
  UNIQUE (task_id, submitter_email),

  -- At least one of URL or response text must be provided
  CONSTRAINT chk_submission_content CHECK (
    submission_url IS NOT NULL OR response_text IS NOT NULL
  )
);
```

**Field Notes:**
- `submitter_email` is used as a lightweight deduplication key (not tied to Supabase Auth — members submit as guests).
- `submission_url` and `response_text` are both optional individually, but the constraint ensures at least one is filled.
- `remarks` is always optional.

**RLS Policies:**
- **Public (anon):** `INSERT` only. No `SELECT` on others' rows.
- **Admin:** Full `SELECT`, plus can `DELETE` if needed.

**Indexes:**
```sql
CREATE INDEX idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX idx_task_submissions_domain ON task_submissions(club_domain);
CREATE INDEX idx_task_submissions_email ON task_submissions(submitter_email);
```

---

### 2.5 `projects`

Club project catalogue. Currently empty; displayed as "Coming Soon" on the public Projects page.

```sql
CREATE TABLE public.projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  thumbnail_url    TEXT,
  technologies     TEXT[] NOT NULL DEFAULT '{}',
  github_url       TEXT,
  demo_url         TEXT,
  status           TEXT NOT NULL
                     CHECK (status IN ('active', 'completed', 'archived')),
  is_published     BOOLEAN NOT NULL DEFAULT false,
  published_at     TIMESTAMPTZ,
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- **Public (anon):** `SELECT` where `is_published = true`.
- **Admin:** Full `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

---

### 2.6 `gallery_items`

Fixed 10-slot gallery. Each slot maps to a slot number (1–10) and an image stored in Supabase Storage.

```sql
CREATE TABLE public.gallery_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot        INTEGER NOT NULL UNIQUE CHECK (slot BETWEEN 1 AND 10),
  image_url   TEXT,              -- Supabase Storage public URL
  alt_text    TEXT,              -- Accessibility description
  caption     TEXT,              -- Optional display caption
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES auth.users(id)
);
```

**Notes:**
- All 10 rows are pre-seeded at setup time (slots 1–10, `image_url = NULL` initially).
- Admins update existing rows; new rows cannot be inserted by the public.
- The 10-slot constraint is enforced by the `CHECK (slot BETWEEN 1 AND 10)` and `UNIQUE(slot)`.

**RLS Policies:**
- **Public (anon):** `SELECT` all rows.
- **Admin:** `UPDATE` only (no `INSERT` or `DELETE` from client; slots are fixed).

---

## 3. Supabase Storage Buckets

| Bucket | Access | Used For |
|---|---|---|
| `gallery` | Public read | Gallery photographs (10 images) |
| `project-thumbnails` | Public read | Project thumbnail images |

**Storage Policies:**
- Admins (authenticated + admin role check via RLS function) may upload and delete.
- Public may only read (download).
- File size limits and MIME type restrictions set at bucket policy level.

---

## 4. Automatic Triggers

### 4.1 New user → auto-create profile

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4.2 Auto-update `updated_at` on task edits

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_weekly_tasks_updated_at
  BEFORE UPDATE ON public.weekly_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

---

## 5. Entity Relationship Diagram

```
auth.users
    │
    ├──< profiles           (1:1)
    ├──< admin_roles        (1:1, optional)
    ├──< weekly_tasks       (1:many, via created_by)
    └──< projects           (1:many, via created_by)

weekly_tasks
    └──< task_submissions   (1:many, via task_id)
```

---

## 6. Validation Summary

| Concern | Where Enforced |
|---|---|
| Required fields | Frontend form + DB `NOT NULL` |
| Domain enum values | Frontend dropdown + DB `CHECK` |
| Year enum values | Frontend dropdown + DB `CHECK` |
| Duplicate submission | Frontend pre-check + DB `UNIQUE(task_id, submitter_email)` |
| Slot range (1–10) | Frontend static slots + DB `CHECK` |
| Submission content | Frontend form + DB `CHECK` constraint |
| Admin access | Frontend route guard + Express middleware + RLS |

---

## 7. Open Items

| # | Item | Impact |
|---|---|---|
| 1 | Supabase project credentials | Cannot write migrations |
| 2 | Admin email addresses | Cannot seed `admin_roles` |
| 3 | Confirm `submitter_email` dedup strategy | Members submit without accounts |
