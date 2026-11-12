import { Calendar, ChevronRight, Clock, FileText } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

function formatDeadline(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDeadlineDetails(dateStr) {
  if (!dateStr) return { isExpired: false, label: 'No deadline', days: null };
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const isExpired = diff < 0;
  return { isExpired, days };
}

export default function TaskCard({ task, onSubmit }) {
  const {
    id,
    title,
    description,
    assigned_domain,
    domain,
    week_number,
    deadline,
    allow_late_submissions,
    submission_schema,
  } = task;

  const targetDomain = assigned_domain || domain || 'Web Development';
  const { isExpired, days } = getDeadlineDetails(deadline);
  const canSubmit = !isExpired || allow_late_submissions;
  const schemaCount = Array.isArray(submission_schema) ? submission_schema.length : 0;

  return (
    <article
      className={`bg-surface border rounded-xl flex flex-col justify-between transition-all ${
        isExpired && !allow_late_submissions
          ? 'border-border/60 opacity-60'
          : 'border-border hover:border-border-2'
      }`}
    >
      <div className="p-5 flex-1 space-y-3">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {week_number && (
            <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-accent/15 text-accent border border-accent/30">
              WEEK {week_number}
            </span>
          )}
          <Badge label={targetDomain} />

          {isExpired && !allow_late_submissions && (
            <span className="px-2 py-0.5 rounded text-2xs font-semibold uppercase bg-surface-3 text-text-muted border border-border">
              Expired
            </span>
          )}

          {isExpired && allow_late_submissions && (
            <span className="px-2 py-0.5 rounded text-2xs font-semibold uppercase bg-yellow-950/60 text-yellow-400 border border-yellow-800">
              Late Submissions Allowed
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-text-primary font-bold text-base leading-snug">
          {title}
        </h3>

        {/* Description */}
        <p className="text-text-muted text-xs leading-relaxed line-clamp-3">
          {description}
        </p>

        {schemaCount > 0 && (
          <div className="flex items-center gap-1.5 text-2xs text-text-muted font-mono pt-1">
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>{schemaCount} dynamic deliverable{schemaCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-3 border-t border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="text-2xs font-mono">
            {deadline ? formatDeadline(deadline) : 'Ongoing'}
          </span>
          {!isExpired && days !== null && (
            <span
              className={`text-2xs font-medium ${
                days <= 2 ? 'text-orange-400' : 'text-text-secondary'
              }`}
            >
              ({days}d left)
            </span>
          )}
        </div>

        {canSubmit ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSubmit && onSubmit(task)}
            className="shrink-0 text-xs"
          >
            {isExpired && allow_late_submissions ? 'Submit (Late)' : 'Open & Submit'}
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <span className="text-2xs font-semibold text-text-muted uppercase px-2 py-1">
            Closed
          </span>
        )}
      </div>
    </article>
  );
}
