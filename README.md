# SkyNet Technical Club — Official Platform

The official platform for **SkyNet**, the technical club of **SRM Institute of Science and Technology, Ramapuram Campus**. 

SkyNet provides a technical community across five domains: **Web Development**, **AI/ML**, **Competitive Programming**, **Content & Design**, and **PR & Marketing**.

---

## Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Lucide React icons
- **Backend**: Node.js (ESM), Express.js, Helmet, CORS, Morgan, Multer
- **Database & Services**: Supabase PostgreSQL with Row Level Security (RLS), Supabase Auth, Supabase Storage
- **Port Strategy**:
  - Backend API: `http://localhost:5000`
  - Frontend Client: `http://localhost:5173` (Vite dev server proxies `/api` to port 5000)

```
├── client/                     # React + Vite Frontend
│   ├── public/                 # Static assets & 10 gallery photo slots (/gallery/photo-01.jpg..photo-10.jpg)
│   ├── src/
│   │   ├── components/         # UI primitives, Admin Form Builder, Layout, Modals
│   │   ├── context/            # AuthContext (Supabase Auth session & token management)
│   │   ├── pages/              # Home, Gallery, Tasks, Projects ("Coming Soon"), Admin Login & Dashboard
│   │   └── services/           # API clients & Supabase browser client
│   └── vercel.json             # Vercel SPA rewrite & static caching rules
├── server/                     # Node.js + Express Backend API
│   ├── src/
│   │   ├── config/             # Environment, Supabase admin & anon clients
│   │   ├── controllers/        # Tasks, Dynamic Submissions, Projects, Auth
│   │   ├── middleware/         # Auth verification, Admin guard, File upload
│   │   ├── services/           # Dynamic JSONB schema validator & Supabase Storage service
│   │   └── routes/             # REST API routes (/api/v1/...)
│   ├── tests/                  # Node.js native test runner suite (35 automated tests)
│   └── Dockerfile              # Container definition for Railway/Render
├── supabase/                   # Database Migrations & Storage Config
│   ├── migrations/
│   │   ├── 001_initial_schema.sql                      # Base tables, RLS policies, triggers
│   │   ├── 002_storage_setup.sql                       # Private & public storage buckets
│   │   └── 003_submissions_duplicate_and_snapshot.sql # Stable email unique constraint & snapshots
│   └── seed.sql                                        # Seed tasks with 9 field types & initial projects
├── render.yaml                 # Render Blueprint configuration
└── docs/                       # Project Architecture, Database, Design System, & Plan docs
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- A Supabase account and project ([https://supabase.com](https://supabase.com))

### 2. Database Migrations
1. Open your project at [app.supabase.com](https://app.supabase.com).
2. Go to the **SQL Editor**.
3. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_setup.sql`
   - `supabase/migrations/003_submissions_duplicate_and_snapshot.sql`
   - *(Optional)* `supabase/seed.sql` to populate sample tasks.

### 3. Backend Setup
```bash
cd server
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY

npm install
npm run dev
# Server will listen on http://localhost:5000
```

### 4. Frontend Setup
```bash
cd client
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npm install
npm run dev
# Vite will serve on http://localhost:5173
```

---

## Admin Account Provisioning

1. In Supabase Dashboard -> **Authentication** -> **Users**, click **Add User** and supply an admin email and secure password.
2. Copy the resulting **User UUID**.
3. In Supabase SQL Editor, run:
```sql
INSERT INTO public.admin_roles (user_id, role)
VALUES ('<PASTE-USER-UUID-HERE>', 'admin')
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.profiles
SET role = 'admin'
WHERE id = '<PASTE-USER-UUID-HERE>';
```
4. Navigate to `http://localhost:5173/admin` and log in with those credentials.

---

## Dynamic Form Architecture

Every weekly task supports a custom `submission_schema` JSONB definition created via the admin drag-and-drop form builder:

- **Supported Field Types (9 total)**:
  1. `short_text`
  2. `long_text`
  3. `url` (with optional regex pattern)
  4. `email`
  5. `number` (with optional min/max)
  6. `date`
  7. `dropdown` (with custom option lists)
  8. `checkbox`
  9. `file_upload` (with size limits and MIME restrictions)

- **Mandatory Member Identification**:
  - Full Name (`member_name`)
  - College/Official Email (`member_email`)
  - Department (`department`)
  - Academic Year (`year`)
  - Section (`section`)
  - Club Domain (`club_domain`)

- **Duplicate Prevention**:
  Submissions enforce `(task_id, LOWER(member_email))` unique constraints. Members submitting duplicate entries for the same challenge receive an HTTP 409 conflict error.

- **Historical Snapshot Preservation**:
  The exact schema definition used at submission time is permanently preserved in `task_submissions.schema_snapshot` so edits to task schemas never corrupt historical records.

---

## Production Deployment

### Frontend (Vercel)
1. Push repository to GitHub/GitLab.
2. In Vercel, import the repo and select the `client` directory as the **Root Directory**.
3. Framework Preset: **Vite**.
4. Configure Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous public key.
   - `VITE_API_BASE_URL`: Your production backend URL (e.g., `https://skynet-api.onrender.com/api/v1`).
5. Deploy. `client/vercel.json` automatically handles SPA routing and asset caching.

### Backend (Render or Railway)
- **Render**: Connect repo; Render uses `render.yaml` or create a Web Service pointing to `server/`:
  - Build Command: `npm ci`
  - Start Command: `npm start`
  - Set Environment Variables: `PORT=5000`, `NODE_ENV=production`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_ORIGIN=https://your-vercel-domain.vercel.app`.
- **Railway**: Connect repo and select Dockerfile or Node runtime in `server/`. Supply the same environment variables.

---

## Running Automated Tests

The test suite runs using Node.js's native test runner (`node:test`) without requiring external test harnesses:

```bash
cd server
npm test
```
- Tests cover endpoint health, unauthenticated route protection, RLS enforcement boundaries, schema definition validation, dynamic submission validation, file size/MIME verification, duplicate detection, and late submission policies.
