-- =============================================================================
-- SKYNET CLUB DATABASE SEED DATA
-- Sample data showcasing the dynamic form submission architecture
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SEED SAMPLE WEEKLY TASK WITH ALL 9 DYNAMIC FIELD TYPES
-- Demonstrates submission_schema JSONB format
-- -----------------------------------------------------------------------------
INSERT INTO public.weekly_tasks (
  id,
  title,
  description,
  assigned_domain,
  week_number,
  deadline,
  status,
  submission_schema
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Week 1: Responsive Technical Portfolio & Project Showcase',
  'Build and deploy a responsive technical portfolio demonstrating modern layout fundamentals, accessibility standards, and clean architecture.',
  'Web Development',
  1,
  now() + interval '14 days',
  'published',
  '[
    {
      "id": "github_repo_url",
      "label": "GitHub Repository URL",
      "type": "url",
      "required": true,
      "placeholder": "https://github.com/username/project",
      "help_text": "Public repository containing clean commits and a documented README.",
      "validation": {
        "pattern": "^https:\\/\\/github\\.com\\/[A-Za-z0-9_.-]+\\/[A-Za-z0-9_.-]+.*$",
        "custom_error": "Please enter a valid GitHub repository URL starting with https://github.com/"
      }
    },
    {
      "id": "live_demo_url",
      "label": "Live Deployment URL",
      "type": "url",
      "required": true,
      "placeholder": "https://my-project.vercel.app",
      "help_text": "Live URL hosted on Vercel, Netlify, or GitHub Pages.",
      "validation": {
        "pattern": "^https?:\\/\\/.+$"
      }
    },
    {
      "id": "tech_stack_summary",
      "label": "Primary Framework / Stack",
      "type": "dropdown",
      "required": true,
      "placeholder": "Select primary stack",
      "help_text": "The main frontend library or framework chosen.",
      "options": [
        "React + Vite",
        "Next.js",
        "Vue.js",
        "Vanilla HTML/CSS/JS",
        "Astro",
        "Other"
      ]
    },
    {
      "id": "technical_challenges",
      "label": "Architecture & Engineering Challenges",
      "type": "long_text",
      "required": true,
      "placeholder": "Describe key technical hurdles encountered and how you solved them...",
      "help_text": "Minimum 50 characters detailing layout or state management decisions.",
      "validation": {
        "min_length": 50,
        "max_length": 2000
      }
    },
    {
      "id": "hours_invested",
      "label": "Estimated Hours Invested",
      "type": "number",
      "required": false,
      "placeholder": "e.g. 12",
      "help_text": "Total hours dedicated to research, coding, and debugging.",
      "validation": {
        "min": 1,
        "max": 120
      }
    },
    {
      "id": "completion_date",
      "label": "Target Completion Date",
      "type": "date",
      "required": false,
      "placeholder": "YYYY-MM-DD",
      "help_text": "The date when the MVP was finalized."
    },
    {
      "id": "peer_review_email",
      "label": "Peer Reviewer Email",
      "type": "email",
      "required": false,
      "placeholder": "colleague@srmist.edu.in",
      "help_text": "SRM email of a peer who code-reviewed your submission."
    },
    {
      "id": "architecture_diagram",
      "label": "Architecture Diagram or Screenshot",
      "type": "file_upload",
      "required": false,
      "placeholder": "Upload PDF or image",
      "help_text": "Upload an architecture diagram or screenshot (PDF, PNG, JPG up to 10MB).",
      "file_restrictions": {
        "max_size_mb": 10,
        "allowed_types": [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/webp"
        ],
        "max_files": 1
      }
    },
    {
      "id": "honor_code_agreement",
      "label": "I certify this code is my original work and complies with SRM Code of Conduct.",
      "type": "checkbox",
      "required": true,
      "help_text": "Mandatory club academic integrity affirmation."
    }
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- SEED SAMPLE PROJECT (COMING SOON SHOWCASE)
-- -----------------------------------------------------------------------------
INSERT INTO public.projects (
  id,
  title,
  description,
  technologies,
  github_url,
  demo_url,
  thumbnail_url,
  status
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'SkyNet Portal & Task Engine',
  'Official club operations platform featuring dynamic schema form generation, automated RLS enforcement, and member portfolio tracking.',
  ARRAY['React', 'Node.js', 'Express', 'Supabase', 'Tailwind CSS'],
  'https://github.com/skynet-club/website',
  NULL,
  NULL,
  'in_progress'
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- HELPER NOTE FOR ADMIN USER CREATION
-- To grant admin access to a user created in auth.users:
--
-- INSERT INTO public.admin_roles (user_id, role)
-- VALUES ('<YOUR-AUTH-USER-UUID>', 'admin')
-- ON CONFLICT (user_id) DO NOTHING;
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = '<YOUR-AUTH-USER-UUID>';
-- -----------------------------------------------------------------------------
