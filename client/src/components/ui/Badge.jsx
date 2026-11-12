const DOMAIN_STYLES = {
  'Web Development':       'bg-blue-950/60 text-blue-400 border-blue-900/60',
  'AI/ML':                 'bg-purple-950/60 text-purple-400 border-purple-900/60',
  'Competitive Programming':'bg-orange-950/60 text-orange-400 border-orange-900/60',
  'Content & Design':      'bg-pink-950/60 text-pink-400 border-pink-900/60',
  'PR & Marketing':        'bg-yellow-950/60 text-yellow-400 border-yellow-900/60',
  'All':                   'bg-accent/10 text-accent border-accent/30',
  'Expired':               'bg-surface-3 text-text-muted border-border',
  'Active':                'bg-accent/10 text-accent border-accent/30',
  'Draft':                 'bg-surface-3 text-text-muted border-border',
}

const BASE = 'inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide rounded border'

export default function Badge({ label, className = '' }) {
  const style = DOMAIN_STYLES[label] ?? 'bg-surface-3 text-text-secondary border-border'
  return (
    <span className={`${BASE} ${style} ${className}`}>
      {label}
    </span>
  )
}
