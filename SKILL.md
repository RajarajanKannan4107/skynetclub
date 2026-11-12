# SKYNET WEBSITE — PROJECT SKILL

## 1. Project Identity

- Project name: SkyNet Official Website
- Organization: SkyNet Club
- Institution: SRM Institute of Science and Technology, Ramapuram
- Website purpose: Public club website and internal task management platform.
- Primary audience: Students, club members, prospective members and administrators.

## 2. Brand Identity

- Brand name: SkyNet
- Primary background: [TO BE CONFIRMED]
- Primary accent: [TO BE CONFIRMED]
- Logo: Use the official SkyNet logo provided in the assets folder.
- Typography: Modern, professional and readable.
- Visual identity: Minimal, premium, technology-focused.

Do not create a new logo or modify the existing brand identity without approval.

## 3. Club Structure

Domains:
1. Web Development
2. AI/ML
3. Competitive Programming
4. Content & Design
5. PR & Marketing

Use these domain names consistently throughout the application.

## 4. Website Pages

- Home
- Gallery
- Club Tasks
- Projects
- Admin Login
- Admin Dashboard

## 5. Task Management Rules

- Admins create and publish weekly tasks.
- Tasks can be assigned to individual domains or all domains.
- Every task must have a title, description, assigned domain and deadline.
- Members can submit their responses through a form.
- Submission data must be stored in Supabase.
- Admins can view and filter all submissions.
- Members must not have access to other members' submissions.
- Prevent duplicate submissions for the same task and member.
- Expired tasks should be clearly marked.

Submission fields:
- Full name
- Department
- Year
- Section
- Club domain
- Submission URL or response
- Optional remarks

## 6. Admin Permissions

Only authorized administrators can:
- Create, edit and delete weekly tasks.
- Publish and unpublish tasks.
- View task submissions.
- Manage projects.
- Manage gallery photographs.
- Edit website content.

Never expose administrative functionality to unauthenticated users.

## 7. Project Management

Current status:
- No published club projects.

Public display:
"Club Projects Coming Soon"

Future projects should support:
- Project name
- Description
- Thumbnail
- Technologies used
- GitHub URL
- Live demo URL
- Project status
- Publication date

## 8. Supabase Rules

Use Supabase PostgreSQL, Auth and Storage.

Required tables:
- profiles
- admin_roles
- weekly_tasks
- task_submissions
- projects
- gallery_items

Security:
- Enable RLS on all relevant tables.
- Public visitors must not access private submissions.
- Members can submit tasks without receiving admin privileges.
- Only authorized admins can read submissions or modify tasks.
- Validate data on both frontend and backend.
- Never expose service-role credentials.
- Use secure Storage policies.

## 9. Design Rules

The website must look like an established technical organization.

Prioritize:
- Visual consistency.
- Clear information hierarchy.
- Professional typography.
- Real photographs.
- Functional interactions.
- Accessibility.
- Responsive layouts.

Avoid:
- Generic AI-generated templates.
- Excessive gradients.
- Unnecessary animations.
- Fake testimonials.
- Fake statistics.
- Fake projects.
- Placeholder content presented as real information.

## 10. Code Architecture

Keep the code modular.

Suggested structure:

client/
  src/
    components/
    pages/
    layouts/
    hooks/
    services/
    context/
    assets/
    styles/

server/
  src/
    routes/
    controllers/
    middleware/
    services/
    config/

supabase/
  migrations/
  seed.sql

Documentation:
- README.md
- .env.example
- SKILL.md

## 11. Development Standards

- Use reusable components.
- Maintain clean code.
- Separate business logic from UI.
- Implement loading, error and empty states.
- Use environment variables.
- Keep dependencies minimal.
- Do not remove working features while modifying other sections.
- Test all forms and admin operations.
- Ask before changing major design or architecture decisions.

## 12. Current Project Status

- Website: To be developed.
- Gallery: Awaiting actual club photographs.
- Tasks: Awaiting admin-created tasks.
- Projects: Coming soon.
- Supabase: Awaiting project configuration.
- Admin accounts: Awaiting authorized email addresses.
- Logo and brand assets: Awaiting official assets.