import { Link } from 'react-router-dom'
import { Zap, ExternalLink } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Club Tasks', to: '/tasks' },
  { label: 'Projects', to: '/projects' },
]

const DOMAINS = [
  'Web Development',
  'AI/ML',
  'Competitive Programming',
  'Content & Design',
  'PR & Marketing',
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-accent/10 border border-accent/30">
                <Zap className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
              </div>
              <span className="text-text-primary font-semibold text-base tracking-tight">
                Sky<span className="text-accent">Net</span>
              </span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              The official technical club of SRM Institute of Science and
              Technology, Ramapuram.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-widest mb-4">
              Navigation
            </p>
            <ul className="space-y-2">
              {NAV_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-text-muted text-sm hover:text-text-secondary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Domains */}
          <div>
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-widest mb-4">
              Domains
            </p>
            <ul className="space-y-2">
              {DOMAINS.map((d) => (
                <li key={d} className="text-text-muted text-sm">
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-text-muted text-xs">
            © {year} SkyNet, SRM IST Ramapuram. All rights reserved.
          </p>
          <p className="text-text-muted text-xs">
            SRM Institute of Science and Technology — Ramapuram Campus
          </p>
        </div>
      </div>
    </footer>
  )
}
