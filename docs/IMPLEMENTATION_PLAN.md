# SkyNet Club Website — Implementation Plan

**Version:** 1.0 (Planning)  
**Status:** Awaiting Approval Before Any Code Is Written

---

> [!IMPORTANT]
> This plan describes the **order and scope** of implementation. No code is written until this document is approved. Items blocked on missing assets are explicitly flagged.

---

## Phase Overview

| Phase | Name | Deliverable |
|---|---|---|
| 0 | Prerequisites | Assets, credentials, environment |
| 1 | Project Scaffolding | Monorepo structure, tooling |
| 2 | Supabase Setup | Schema, RLS, storage, seed |
| 3 | Backend (Express) | API routes, auth middleware |
| 4 | Frontend Foundation | Routing, layout, design tokens |
| 5 | Public Pages | Home, Gallery, Tasks, Projects |
| 6 | Admin Dashboard | Full admin panel |
| 7 | Integration & Testing | End-to-end flow validation |
| 8 | Deployment | Build, host, configure |

---

## Phase 0 — Prerequisites

**Goal:** Gather everything needed before writing a single line of code.

| # | Item | Status |
|---|---|---|
| 0.1 | Official SkyNet logo (SVG or PNG) | ⏳ Awaiting |
| 0.2 | 10 gallery photographs | ⏳ Awaiting |
| 0.3 | Brand colors confirmed | ⏳ Awaiting |
| 0.4 | Supabase project created (URL + anon key) | ⏳ Awaiting |
| 0.5 | Admin email addresses provided | ⏳ Awaiting |
| 0.6 | Deployment target confirmed | ⏳ Awaiting |

> [!WARNING]
> Phase 1 (scaffolding) and Phase 2 (database) can begin without the logo and photos, but styling and gallery cannot be finalized. Colors must be confirmed before any CSS is written.

---

## Phase 1 — Project Scaffolding

**Goal:** Set up the monorepo with correct folder structure and tooling.

| # | Task | Details |
|---|---|---|
| 1.1 | Create monorepo root | `skynet-website/` with `client/`, `server/`, `supabase/`, `docs/` |
| 1.2 | Initialize Vite + React client | `npm create vite@latest client -- --template react` |
| 1.3 | Initialize Express server | `npm init` in `server/`, install `express cors dotenv` |
| 1.4 | Configure `.gitignore` | Exclude `.env`, `node_modules`, `dist` |
| 1.5 | Create `.env.example` | Document all required env vars |
| 1.6 | Install Supabase JS client | `@supabase/supabase-js` in `client/` |
| 1.7 | Create folder structure | Per `PROJECT_ARCHITECTURE.md §2` |
| 1.8 | Configure Vite proxy | Proxy `/api` to `localhost:5000` in dev |

**Deliverable:** Runnable empty shell — `npm run dev` works with no errors.

---

## Phase 2 — Supabase Setup

**Goal:** Create all tables, RLS policies, storage buckets, triggers and seed data.

| # | Task | Details |
|---|---|---|
| 2.1 | Write migration `001_initial_schema.sql` | All 6 tables per `DATABASE_DESIGN.md §2` |
| 2.2 | Add RLS policies | Per table rules in `DATABASE_DESIGN.md §2` |
| 2.3 | Add `updated_at` triggers | `weekly_tasks`, `projects` |
| 2.4 | Add `handle_new_user` trigger | Auto-create profile on user signup |
| 2.5 | Create Storage buckets | `gallery` (public), `project-thumbnails` (public) |
| 2.6 | Set Storage policies | Admins upload; public read-only |
| 2.7 | Seed `gallery_items` | Insert 10 rows (slot 1–10, `image_url = NULL`) |
| 2.8 | Seed `admin_roles` | Insert rows for confirmed admin emails |
| 2.9 | Validate RLS | Test anon vs admin access via Supabase Table Editor |

**Blocked on:** 0.4 (Supabase credentials), 0.5 (admin emails)

**Deliverable:** All migrations applied; tables visible in Supabase dashboard.

---

## Phase 3 — Backend (Express API)

**Goal:** Implement all API endpoints with authentication and authorization middleware.

| # | Task | Details |
|---|---|---|
| 3.1 | Express entry point | `index.js` with CORS, JSON body parser, routes |
| 3.2 | Supabase service-role client | `config/supabase.js` using `SUPABASE_SERVICE_ROLE_KEY` |
| 3.3 | `authMiddleware` | Extract Bearer token → verify with Supabase Auth → attach `req.user` |
| 3.4 | `adminMiddleware` | Query `admin_roles` → 403 if user not an admin |
| 3.5 | Tasks router + controller | All 6 task endpoints (see Architecture §6) |
| 3.6 | Submissions router + controller | 3 submission endpoints |
| 3.7 | Gallery router + controller | 2 gallery endpoints |
| 3.8 | Projects router + controller | 4 project endpoints |
| 3.9 | Input validation | Validate required fields, enums, URL formats in controllers |
| 3.10 | Error handling middleware | Consistent JSON error responses |

**Deliverable:** All API endpoints testable via curl or Postman.

---

## Phase 4 — Frontend Foundation

**Goal:** Routing, layouts, design tokens and global styles.

| # | Task | Details |
|---|---|---|
| 4.1 | Install React Router | `react-router-dom` v6 |
| 4.2 | Configure `App.jsx` routes | All routes from Architecture §3 |
| 4.3 | Create `AuthContext` | Supabase session, login, logout, `isAdmin` state |
| 4.4 | Create `useAuth` hook | Consumes `AuthContext` |
| 4.5 | Create `PublicLayout` | Navbar + Footer wrapper |
| 4.6 | Create `AdminLayout` | Protected wrapper → redirects if not authenticated |
| 4.7 | Write `variables.css` | All design tokens from `DESIGN_SYSTEM.md` |
| 4.8 | Write `global.css` | Reset, base typography, body background |
| 4.9 | Build `Navbar` component | Logo, links, responsive hamburger |
| 4.10 | Build `Footer` component | Minimal, honest content only |
| 4.11 | Build `Button` component | 3 variants, 3 sizes, all states |
| 4.12 | Build `Spinner` component | Loading indicator |
| 4.13 | Build `Badge` component | Domain tags |

**Blocked on:** 0.1 (logo), 0.3 (colors) — `Navbar` and `variables.css` require these.

**Deliverable:** Navigation between all pages works; layouts render correctly.

---

## Phase 5 — Public Pages

**Goal:** Implement all four public-facing pages.

### 5.1 Home Page
| # | Task |
|---|---|
| 5.1.1 | Hero section (club name, tagline, CTA button) |
| 5.1.2 | "About SkyNet" section (brief club description — real content only) |
| 5.1.3 | Five domain cards (names from SKILL.md §3) |

### 5.2 Gallery Page
| # | Task |
|---|---|
| 5.2.1 | Fetch 10 gallery slots from API |
| 5.2.2 | Render responsive 10-slot grid |
| 5.2.3 | Show neutral empty-state for unpopulated slots |
| 5.2.4 | Show real photos + captions once photos are uploaded |

**Blocked on:** 0.2 (10 photographs)

### 5.3 Club Tasks Page
| # | Task |
|---|---|
| 5.3.1 | Fetch published tasks from API |
| 5.3.2 | Build `TaskCard` component (title, domain badge, deadline, description) |
| 5.3.3 | Expired task styling (muted, "Expired" badge) |
| 5.3.4 | Domain filter + status filter |
| 5.3.5 | Empty state ("No active tasks at the moment") |
| 5.3.6 | `SubmissionForm` component (all 7 fields from SKILL.md §5) |
| 5.3.7 | Duplicate submission detection (pre-submit check by email + task) |
| 5.3.8 | Form validation (required fields, URL format) |
| 5.3.9 | Success and error states after submission |

### 5.4 Projects Page
| # | Task |
|---|---|
| 5.4.1 | Fetch published projects from API |
| 5.4.2 | If none published: display "Club Projects Coming Soon" message |
| 5.4.3 | When projects exist: render project cards with all fields |

**Deliverable:** All public pages functional, responsive, with correct empty states.

---

## Phase 6 — Admin Dashboard

**Goal:** Full admin panel behind authentication.

### 6.1 Admin Login
| # | Task |
|---|---|
| 6.1.1 | Minimal login form (email + password) |
| 6.1.2 | Call `supabase.auth.signInWithPassword()` |
| 6.1.3 | On success: verify admin role via API, redirect to dashboard |
| 6.1.4 | On failure: display clear error message |

### 6.2 Task Manager
| # | Task |
|---|---|
| 6.2.1 | Task list table (all tasks, all statuses) |
| 6.2.2 | "New Task" button → `TaskForm` |
| 6.2.3 | `TaskForm`: title, description, domain select, deadline picker, publish toggle |
| 6.2.4 | Edit existing task (pre-populated form) |
| 6.2.5 | Delete task (with confirmation dialog) |
| 6.2.6 | Publish / unpublish toggle per task |

### 6.3 Submissions Viewer
| # | Task |
|---|---|
| 6.3.1 | Submissions table (all fields visible to admin) |
| 6.3.2 | Filter by task, domain, date range |
| 6.3.3 | Submission count per task |

### 6.4 Gallery Manager
| # | Task |
|---|---|
| 6.4.1 | Display 10 slots with current images or empty-state |
| 6.4.2 | Per-slot upload button → uploads to Supabase Storage |
| 6.4.3 | Per-slot `alt_text` and `caption` editor |
| 6.4.4 | Update gallery_items row on save |

### 6.5 Project Manager
| # | Task |
|---|---|
| 6.5.1 | Project list with all projects (admin view) |
| 6.5.2 | "New Project" button → `ProjectForm` |
| 6.5.3 | `ProjectForm`: name, description, thumbnail upload, technologies, URLs, status |
| 6.5.4 | Edit existing project |
| 6.5.5 | Delete project (with confirmation) |
| 6.5.6 | Publish / unpublish toggle |

**Deliverable:** Admin can perform all operations; unauthorized users are blocked at every layer.

---

## Phase 7 — Integration & Testing

**Goal:** Verify every user flow end-to-end.

| # | Test Scenario |
|---|---|
| 7.1 | Public visitor can view home, gallery, tasks, projects |
| 7.2 | Public visitor can submit a task form successfully |
| 7.3 | Duplicate submission attempt is rejected |
| 7.4 | Submission form rejects missing required fields |
| 7.5 | Expired task shows "Expired" badge and disables submission |
| 7.6 | Admin can log in and access dashboard |
| 7.7 | Non-admin user cannot access `/admin/dashboard` |
| 7.8 | Unauthenticated request to admin API endpoints returns 401/403 |
| 7.9 | Admin can create, edit, publish and delete a task |
| 7.10 | Admin can view and filter submissions |
| 7.11 | Admin can upload gallery images to all 10 slots |
| 7.12 | Admin can create and publish a project |
| 7.13 | Projects page shows "Coming Soon" when no projects are published |
| 7.14 | All pages render correctly on mobile (375px), tablet (768px), desktop (1280px) |
| 7.15 | All form inputs are keyboard accessible |

---

## Phase 8 — Deployment

**Goal:** Build and deploy to the confirmed hosting target.

| # | Task | Blocked on |
|---|---|---|
| 8.1 | Configure production env vars | 0.4, 0.6 |
| 8.2 | Build Vite client (`npm run build`) | Phase 7 complete |
| 8.3 | Deploy Express server | 0.6 (hosting target) |
| 8.4 | Deploy frontend static files | 0.6 (hosting target) |
| 8.5 | Set CORS origin to production domain | 0.6 |
| 8.6 | Verify Supabase RLS in production | Phase 7 complete |
| 8.7 | Confirm all env vars set correctly in production | 0.6 |

---

## Dependency Graph

```
Phase 0 (Prerequisites)
    │
    ├─► Phase 1 (Scaffolding)       ← can start with partial Phase 0
    │       │
    │       └─► Phase 2 (Supabase)  ← needs 0.4 + 0.5
    │       └─► Phase 3 (Backend)   ← needs Phase 2
    │       └─► Phase 4 (Frontend Foundation) ← needs 0.1 + 0.3 for styling
    │               │
    │               └─► Phase 5 (Public Pages) ← 5.2 needs 0.2
    │               └─► Phase 6 (Admin Dashboard) ← needs Phase 3 + Phase 2
    │
Phase 7 (Testing) ← needs Phases 2–6 complete
    │
Phase 8 (Deployment) ← needs 0.6 + Phase 7
```

---

## What Will NOT Be Built (Without Approval)

| Item | Reason |
|---|---|
| Any fake club statistics | Prohibited by SKILL.md §9 |
| Any fake club projects | Prohibited by SKILL.md §9 |
| Any fake testimonials | Prohibited by SKILL.md §9 |
| Placeholder content presented as real | Prohibited by SKILL.md §9 |
| Social media links | No confirmed official accounts |
| Member registration / self-signup | Not in scope; admin accounts provisioned manually |
| Email notifications | Not in scope; not in SKILL.md |
| Search functionality | Not in scope |
| Dark/light mode toggle | Not in scope (brand colors TBC) |

---

## Approval Checklist

Before implementation begins, confirm:

- [ ] This architecture document is approved
- [ ] Database schema is approved
- [ ] Design system approach is approved
- [ ] Implementation plan order is approved
- [ ] Brand colors provided
- [ ] Logo file provided
- [ ] Supabase project created and credentials shared
- [ ] Admin emails provided
- [ ] Deployment target confirmed
