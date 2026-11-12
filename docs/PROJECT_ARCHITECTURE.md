# SkyNet Club Website — Project Architecture

**Institution:** SRM Institute of Science and Technology, Ramapuram  
**Version:** 1.0 (Planning)  
**Status:** Awaiting Approval

---

## 1. Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React.js (Vite) | Fast HMR, modern bundling, component-based |
| Backend | Node.js + Express | Lightweight REST API layer |
| Database | Supabase PostgreSQL | Managed Postgres with built-in RLS |
| Auth | Supabase Auth | Email/password auth with JWT |
| Storage | Supabase Storage | Gallery image hosting with secure policies |
| Styling | CSS Modules or plain CSS | Zero dependency, predictable scoping |
| Deployment | TBD | Awaiting confirmation |

> [!NOTE]
> No additional frameworks (ORMs, state libraries, CSS frameworks) are added unless explicitly approved. Dependencies are kept minimal per SKILL.md §11.

---

## 2. Monorepo Folder Structure

```
skynet-website/
├── client/                        # React + Vite frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/                # Logo, gallery photos (10 slots), icons
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/                # Generic: Button, Card, Badge, Modal, Spinner
│   │   │   ├── layout/            # Navbar, Footer, Sidebar
│   │   │   └── shared/            # TaskCard, GalleryGrid, SubmissionForm
│   │   ├── pages/                 # Route-level page components
│   │   │   ├── Home.jsx
│   │   │   ├── Gallery.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── layouts/               # Page layout wrappers
│   │   │   ├── PublicLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useTasks.js
│   │   │   └── useSubmissions.js
│   │   ├── services/              # API and Supabase client calls
│   │   │   ├── supabaseClient.js
│   │   │   ├── authService.js
│   │   │   ├── taskService.js
│   │   │   ├── submissionService.js
│   │   │   ├── galleryService.js
│   │   │   └── projectService.js
│   │   ├── context/               # React context providers
│   │   │   └── AuthContext.jsx
│   │   ├── styles/                # Global styles and CSS variables
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   ├── utils/                 # Helpers (date formatting, validation)
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── .env.local                 # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│
├── server/                        # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js        # Supabase service-role client (server-only)
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js  # Validates Supabase JWT from request header
│   │   │   └── adminMiddleware.js # Checks admin_roles table for authorization
│   │   ├── controllers/
│   │   │   ├── taskController.js
│   │   │   ├── submissionController.js
│   │   │   ├── galleryController.js
│   │   │   └── projectController.js
│   │   ├── routes/
│   │   │   ├── tasks.js
│   │   │   ├── submissions.js
│   │   │   ├── gallery.js
│   │   │   └── projects.js
│   │   └── services/              # Business logic layer
│   │       ├── taskService.js
│   │       └── submissionService.js
│   ├── index.js                   # Express entry point
│   └── .env                       # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
│
├── supabase/
│   ├── migrations/                # SQL migration files (versioned)
│   │   └── 001_initial_schema.sql
│   └── seed.sql                   # Optional: seed admin accounts
│
├── docs/
│   ├── PROJECT_ARCHITECTURE.md    # (this file)
│   ├── DATABASE_DESIGN.md
│   ├── DESIGN_SYSTEM.md
│   └── IMPLEMENTATION_PLAN.md
│
├── SKILL.md
├── README.md
└── .env.example
```

---

## 3. Pages and Routing

| Route | Component | Access | Description |
|---|---|---|---|
| `/` | `Home.jsx` | Public | Landing page with club intro |
| `/gallery` | `Gallery.jsx` | Public | 10-slot photo gallery |
| `/tasks` | `Tasks.jsx` | Public | Active tasks + submission form |
| `/projects` | `Projects.jsx` | Public | "Coming Soon" placeholder |
| `/admin` | `AdminLogin.jsx` | Public | Admin email/password login |
| `/admin/dashboard` | `AdminDashboard.jsx` | Admin only | Full admin panel |

**Protected route guard:** `AdminLayout.jsx` checks `AuthContext` before rendering any `/admin/dashboard` content. Unauthenticated requests redirect to `/admin`.

---

## 4. Authentication Flow

```
1. Admin visits /admin
2. Enters email + password
3. Frontend calls supabase.auth.signInWithPassword()
4. Supabase returns JWT access token
5. Frontend stores session via Supabase JS SDK (localStorage)
6. AuthContext reads session on mount and on auth state change
7. All protected API calls attach Bearer <JWT> header
8. Express authMiddleware verifies JWT with Supabase Auth
9. adminMiddleware cross-checks user UUID against admin_roles table
10. If not an admin → 403 Forbidden
```

> [!IMPORTANT]
> The service-role key is **never** sent to the frontend. Only the anon key is exposed to the client. All privileged operations (view submissions, manage tasks) go through the Express server.

---

## 5. Authorization Model

| Actor | Capability |
|---|---|
| Public visitor | View home, gallery, active tasks; submit task forms |
| Admin (authenticated) | All public capabilities + create/edit/delete tasks, view/filter all submissions, manage gallery, manage projects |

Enforcement is **double-layered**:
- **Frontend:** UI elements hidden from non-admins; protected routes redirect.
- **Backend:** Every admin API endpoint validates JWT + `admin_roles` row.
- **Database:** RLS policies on Supabase tables as a third layer of defence.

---

## 6. API Endpoint Summary

All API routes are prefixed with `/api/v1`.

### Tasks
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks` | Public | List all published, non-expired tasks |
| `GET` | `/tasks/:id` | Public | Get single task details |
| `POST` | `/tasks` | Admin | Create a new task |
| `PUT` | `/tasks/:id` | Admin | Update task |
| `DELETE` | `/tasks/:id` | Admin | Delete task |
| `PATCH` | `/tasks/:id/publish` | Admin | Toggle publish/unpublish |

### Submissions
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/submissions` | Public | Submit a task response |
| `GET` | `/submissions` | Admin | List all submissions (filterable) |
| `GET` | `/submissions/:taskId` | Admin | Submissions for one task |

### Gallery
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/gallery` | Public | List all 10 gallery slots |
| `PUT` | `/gallery/:slot` | Admin | Update a specific slot image |

### Projects
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/projects` | Public | List published projects |
| `POST` | `/projects` | Admin | Create a project |
| `PUT` | `/projects/:id` | Admin | Update a project |
| `DELETE` | `/projects/:id` | Admin | Delete a project |

---

## 7. Component Hierarchy (High Level)

```
App
├── AuthContext.Provider
│   ├── PublicLayout (Navbar + Footer)
│   │   ├── Home
│   │   ├── Gallery
│   │   ├── Tasks
│   │   │   └── SubmissionForm (modal/inline)
│   │   └── Projects
│   └── AdminLayout (Sidebar + Header)
│       ├── AdminLogin  (no sidebar)
│       └── AdminDashboard
│           ├── TaskManager
│           │   ├── TaskForm (create/edit)
│           │   └── TaskList
│           ├── SubmissionsViewer
│           │   └── SubmissionFilters
│           ├── GalleryManager
│           │   └── GallerySlotEditor (10 slots)
│           └── ProjectManager
```

---

## 8. Environment Variables

### `client/.env.local`
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### `server/.env`
```
PORT=5000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLIENT_ORIGIN=http://localhost:5173
```

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` must never be committed to source control or exposed to the client. Add `server/.env` to `.gitignore`.

---

## 9. Open Items (Awaiting Confirmation)

| # | Item | Needed For |
|---|---|---|
| 1 | Official SkyNet logo file | `client/src/assets/` |
| 2 | 10 gallery photographs | Gallery page |
| 3 | Brand colors (primary background, accent) | Design system |
| 4 | Admin email addresses | Supabase Auth + `admin_roles` seed |
| 5 | Deployment target | Build config, CORS origin |
| 6 | Supabase project URL + anon key | All Supabase integration |
