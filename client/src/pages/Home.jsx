import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Code2, Brain, Trophy, Palette, Megaphone, ChevronRight, Image as ImageIcon } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const DOMAINS = [
  {
    name: 'Web Development',
    icon: Code2,
    description:
      'Building modern, performant web applications — from pixel-perfect frontends to robust backend systems.',
  },
  {
    name: 'AI/ML',
    icon: Brain,
    description:
      'Exploring machine learning, deep learning, and applied AI to solve real-world engineering problems.',
  },
  {
    name: 'Competitive Programming',
    icon: Trophy,
    description:
      'Sharpening algorithmic thinking and problem-solving skills through contests and structured practice.',
  },
  {
    name: 'Content & Design',
    icon: Palette,
    description:
      'Crafting visual identities, written content, and digital media that communicate clearly and creatively.',
  },
  {
    name: 'PR & Marketing',
    icon: Megaphone,
    description:
      "Growing the club's presence, coordinating outreach, and building meaningful connections across campus.",
  },
]

// Preview gallery uses first 6 slots from local paths
const GALLERY_PREVIEW = [
  '/gallery/photo-01.jpg',
  '/gallery/photo-02.jpg',
  '/gallery/photo-03.jpg',
  '/gallery/photo-04.jpg',
  '/gallery/photo-05.jpg',
  '/gallery/photo-06.jpg',
]

function GalleryPreviewSlot({ src, index }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <div className="aspect-square bg-surface-2 border border-border rounded flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-text-muted" strokeWidth={1.5} />
      </div>
    )
  }
  return (
    <div className="aspect-square bg-surface-2 border border-border rounded overflow-hidden">
      <img
        src={src}
        alt={`Gallery preview ${index + 1}`}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setErrored(true)}
      />
    </div>
  )
}



export default function Home() {
  return (
    <div className="pt-16">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="min-h-[85vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-accent text-xs font-medium tracking-wide uppercase">
                SRM IST Ramapuram
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text-primary leading-[1.05] tracking-tight mb-6">
              Sky
              <span className="text-accent">Net</span>
            </h1>
            <p className="text-xl sm:text-2xl text-text-secondary font-light leading-relaxed mb-4 max-w-xl">
              The Official Technical Club
            </p>
            <p className="text-text-muted text-base leading-relaxed mb-10 max-w-lg">
              Five domains. One community. Building the engineers of tomorrow
              through collaboration, competition, and craft.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/tasks">
                <Button variant="primary" size="lg">
                  View Tasks
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/gallery">
                <Button variant="secondary" size="lg">
                  Gallery
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* ── ABOUT ───────────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">
              About
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight mb-6">
              Building technical talent
              <br />
              <span className="text-text-secondary font-light">at SRM Ramapuram</span>
            </h2>
            <div className="space-y-4 text-text-muted text-base leading-relaxed">
              <p>
                SkyNet is the official technical club of SRM Institute of Science
                and Technology, Ramapuram — a space where students across all
                branches grow their skills, collaborate on real projects, and
                engage with the broader tech community.
              </p>
              <p>
                Whether you're writing your first line of code or refining a
                machine learning model, SkyNet provides the structured environment
                and peer support to help you get better, faster.
              </p>
            </div>
          </div>

          {/* Stats-free info panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Technical Domains', value: '5', note: 'Focused tracks' },
              { label: 'Weekly Tasks', value: 'Active', note: 'Skill-building assignments' },
              { label: 'Institution', value: 'SRM IST', note: 'Ramapuram Campus' },
              { label: 'Projects', value: 'Coming', note: 'Showcase in development' },
            ].map(({ label, value, note }) => (
              <div
                key={label}
                className="bg-surface border border-border rounded p-5"
              >
                <p className="text-text-primary font-semibold text-xl mb-0.5">{value}</p>
                <p className="text-text-secondary text-sm font-medium">{label}</p>
                <p className="text-text-muted text-xs mt-1">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* ── DOMAINS ─────────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">
            Domains
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight">
            Five tracks. One club.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOMAINS.map(({ name, icon: Icon, description }) => (
            <div
              key={name}
              className="bg-surface border border-border rounded p-6 hover:border-border-2 transition-colors group"
            >
              <div className="w-10 h-10 rounded bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
                <Icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="text-text-primary font-semibold text-base mb-2">{name}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* ── ACTIVITIES ──────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">
            Activities
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight">
            How we operate
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Weekly Tasks',
              description:
                'Admins publish structured assignments every week. Members submit their work, building consistent habits and measurable skills.',
              cta: { label: 'View Tasks', to: '/tasks' },
            },
            {
              title: 'Cross-Domain Collaboration',
              description:
                'Projects and events bring members from different domains together — combining design, engineering, and communication in one team.',
              cta: null,
            },
            {
              title: 'Projects Showcase',
              description:
                'Completed work is published for the institution and industry to see — a live portfolio of what SkyNet members build.',
              cta: { label: 'Projects', to: '/projects' },
            },
          ].map(({ title, description, cta }) => (
            <div key={title} className="flex flex-col">
              <div className="w-px h-8 bg-accent mb-5" />
              <h3 className="text-text-primary font-semibold text-base mb-3">{title}</h3>
              <p className="text-text-muted text-sm leading-relaxed flex-1">{description}</p>
              {cta && (
                <Link
                  to={cta.to}
                  className="inline-flex items-center gap-1 text-accent text-sm font-medium mt-4 hover:text-accent-hover transition-colors"
                >
                  {cta.label}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* ── GALLERY PREVIEW ─────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">
              Gallery
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
              In the moment
            </h2>
          </div>
          <Link
            to="/gallery"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GALLERY_PREVIEW.map((src, i) => (
            <GalleryPreviewSlot key={src} src={src} index={i} />
          ))}
        </div>

        <div className="sm:hidden mt-5">
          <Link to="/gallery">
            <Button variant="secondary" size="sm">
              View Gallery
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* ── PROJECTS PREVIEW ────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">
              Projects
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
              What we're building
            </h2>
          </div>
        </div>

        <div className="bg-surface border border-border rounded p-10 text-center">
          <p className="text-text-muted text-base mb-2">
            Club Projects Coming Soon
          </p>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            SkyNet's project showcase is under development. Check back when the
            first cohort of projects is published.
          </p>
          <div className="mt-6">
            <Link to="/projects">
              <Button variant="secondary" size="sm">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* ── CONTACT ─────────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">
            Contact
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight mb-4">
            Get in touch
          </h2>
          <p className="text-text-muted text-base leading-relaxed mb-6">
            Interested in joining SkyNet or collaborating on a project? Reach out
            through your department or connect with us on campus.
          </p>
          <p className="text-text-muted text-sm">
            SRM Institute of Science and Technology — Ramapuram Campus
          </p>
        </div>
      </section>
    </div>
  )
}
