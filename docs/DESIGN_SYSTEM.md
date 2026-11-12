# SkyNet Club Website — Design System

**Version:** 1.0 (Planning)  
**Status:** Partially Confirmed — Colors Awaiting Approval

---

> [!WARNING]
> Brand colors (primary background and primary accent) are listed as **[TO BE CONFIRMED]** in SKILL.md. The color tokens below use **placeholder names only**. Do not begin styling until confirmed values are provided.

---

## 1. Brand Principles

| Principle | Guidance |
|---|---|
| **Minimal** | Use whitespace intentionally. Avoid decorative clutter. |
| **Premium** | Typography-first hierarchy. Real photos, not illustrations. |
| **Technical** | Precision in layout. Grid-based. Consistent spacing. |
| **Accessible** | WCAG 2.1 AA contrast ratios. Keyboard navigable. |

---

## 2. Color Tokens

> [!IMPORTANT]
> Replace all `[TBC]` values with the confirmed brand colors before implementation begins.

```css
/* variables.css */

:root {
  /* Brand — awaiting confirmation */
  --color-bg-primary:      [TBC];   /* Primary page background */
  --color-accent:          [TBC];   /* Primary accent / CTA color */
  --color-accent-hover:    [TBC];   /* Accent on hover (slightly lighter or darker) */

  /* Neutrals */
  --color-text-primary:    [TBC];   /* Main body text */
  --color-text-secondary:  [TBC];   /* Subtext, captions, metadata */
  --color-text-muted:      [TBC];   /* Disabled, placeholder text */
  --color-border:          [TBC];   /* Card borders, dividers */
  --color-surface:         [TBC];   /* Cards, panels (slight offset from bg) */

  /* Semantic */
  --color-success:         #22c55e;
  --color-warning:         #f59e0b;
  --color-error:           #ef4444;
  --color-info:            #3b82f6;

  /* Expired task indicator */
  --color-expired:         #6b7280;
}
```

---

## 3. Typography

### Font Selection
- **Primary font:** A modern sans-serif (e.g., Inter, DM Sans, or system-ui fallback).
- Loaded via `@font-face` or Google Fonts — decision deferred until brand assets arrive.
- Fallback stack: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Type Scale

| Token | Size | Weight | Use |
|---|---|---|---|
| `--text-xs` | 0.75rem (12px) | 400 | Labels, badges |
| `--text-sm` | 0.875rem (14px) | 400 | Body small, captions |
| `--text-base` | 1rem (16px) | 400 | Body text |
| `--text-lg` | 1.125rem (18px) | 500 | Subheadings |
| `--text-xl` | 1.25rem (20px) | 600 | Section headings |
| `--text-2xl` | 1.5rem (24px) | 600 | Page headings |
| `--text-3xl` | 1.875rem (30px) | 700 | Hero headings |
| `--text-4xl` | 2.25rem (36px) | 700 | Display / banner text |

```css
:root {
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;

  --line-height-tight:  1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

---

## 4. Spacing Scale

8px base grid.

```css
:root {
  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
}
```

---

## 5. Border Radius

```css
:root {
  --radius-sm:   0.25rem;   /*  4px — tags, badges */
  --radius-md:   0.5rem;    /*  8px — inputs, buttons */
  --radius-lg:   0.75rem;   /* 12px — cards */
  --radius-xl:   1rem;      /* 16px — modals */
  --radius-full: 9999px;    /* Pills */
}
```

---

## 6. Shadow Scale

```css
:root {
  --shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md:  0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-lg:  0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl:  0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}
```

---

## 7. Responsive Breakpoints

```css
/* Mobile-first breakpoints */
:root {
  --bp-sm:  640px;
  --bp-md:  768px;
  --bp-lg:  1024px;
  --bp-xl:  1280px;
  --bp-2xl: 1536px;
}
```

Usage in media queries:
```css
@media (min-width: 768px) { /* tablet and up */ }
@media (min-width: 1024px) { /* desktop and up */ }
```

---

## 8. UI Component Specifications

### 8.1 Button

Three variants: `primary`, `secondary`, `ghost`

```
Primary:   bg=accent, text=white, hover=accent-hover
Secondary: bg=surface, text=text-primary, border=border
Ghost:     bg=transparent, text=accent, hover=surface
```

Sizes: `sm` | `md` (default) | `lg`  
States: default, hover, focus (visible ring), disabled (opacity 0.5, cursor-not-allowed), loading (spinner inline)

---

### 8.2 Card

```
bg: --color-surface
border: 1px solid --color-border
border-radius: --radius-lg
padding: --space-6
box-shadow: --shadow-sm
```

---

### 8.3 Badge / Domain Tag

Small pill indicating a task's assigned domain.

```
bg: domain-specific tint (to be assigned per domain)
text: domain-specific color
border-radius: --radius-full
padding: --space-1 --space-3
font-size: --text-xs
font-weight: 600
```

Domain colors are defined once confirmed brand colors are available.

---

### 8.4 Form Inputs

```
border: 1px solid --color-border
border-radius: --radius-md
padding: --space-3 --space-4
focus: outline 2px solid --color-accent, offset 2px
error: border-color --color-error
font-size: --text-base
```

---

### 8.5 Navbar

- Fixed top, full width.
- Logo on left; navigation links right.
- Mobile: hamburger menu → slide-in or dropdown.
- Active route highlighted.
- No "Admin" link visible unless admin is authenticated.

---

### 8.6 Footer

- Simple, single row or two-column.
- Club name, institution name, copyright.
- No fake social links unless official accounts are confirmed.

---

## 9. Page-Level Layout Specifications

### 9.1 Home Page

- Hero section: Club name, tagline, CTA ("View Tasks" or "Learn More").
- Brief "About SkyNet" section.
- Domain cards (5 domains, layout: 3 + 2 or 2+2+1 grid on desktop, single column mobile).
- No fake statistics or fake testimonials.

### 9.2 Gallery Page

- 10-slot grid.
- Desktop: 2 or 3 columns.
- Tablet: 2 columns.
- Mobile: 1 column.
- Each slot shows the real photograph (once supplied) or a neutral empty-state placeholder (not fake content).
- Optional caption beneath each image.

### 9.3 Club Tasks Page

- Filter bar: by domain, by status (active / expired).
- Task cards: title, domain badge, deadline, description excerpt, "Submit" CTA.
- Expired tasks visually differentiated (muted color, "Expired" badge).
- Clicking "Submit" opens a submission form (inline panel or modal).
- No tasks visible if none are published.

### 9.4 Projects Page

- Centered "Club Projects Coming Soon" message.
- Professional layout — not a bare placeholder.
- When projects are published in future, displays project cards.

### 9.5 Admin Login Page

- Minimal, centered card layout.
- Email + password fields.
- Clear error message on invalid credentials.
- No "Sign Up" link (admin accounts are provisioned manually).

### 9.6 Admin Dashboard

- Sidebar navigation: Tasks | Submissions | Gallery | Projects.
- Task Manager: table of all tasks with edit/delete/publish actions + "New Task" button.
- Submissions Viewer: table with filter by task, domain, date.
- Gallery Manager: 10 slot grid — each slot has an upload button.
- Project Manager: list of projects with edit/delete/publish actions + "New Project" button.

---

## 10. Accessibility Requirements

- All interactive elements reachable via keyboard (`Tab` / `Shift+Tab`).
- Focus styles always visible (never `outline: none` without replacement).
- All images have descriptive `alt` text.
- Form inputs have associated `<label>` elements.
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for body text, 3:1 for large text).
- Error messages not conveyed by color alone (include icon or text).

---

## 11. Animation Policy

- Use only functional transitions (e.g., menu open/close, modal fade).
- Maximum duration: 200ms for micro-interactions, 300ms for modals.
- Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Open Items

| # | Item | Blocks |
|---|---|---|
| 1 | Primary background color | All color tokens |
| 2 | Primary accent color | Buttons, links, focus rings |
| 3 | Official logo file | Navbar, favicon |
| 4 | Chosen typeface | Typography implementation |
| 5 | 10 gallery photographs | Gallery page |
