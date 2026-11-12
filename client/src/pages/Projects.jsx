import { useState, useEffect } from 'react';
import { Layers, ExternalLink, Github } from 'lucide-react';
import { getProjects } from '../services/api';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const FUTURE_FIELDS = [
  'Project name & description',
  'Technologies used',
  'GitHub repository',
  'Live demo link',
  'Project status',
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await getProjects();
        if (res.success && Array.isArray(res.data)) {
          // Show completed, published, and in-progress projects
          const published = res.data.filter(
            (p) => p.status === 'completed' || p.status === 'published' || p.status === 'in_progress'
          );
          setProjects(published);
        }
      } catch (err) {
        console.warn('Could not fetch projects:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-16">
          <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">
            Projects
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-4">
            Project Showcase
          </h1>
          <p className="text-text-muted text-base max-w-xl">
            SkyNet's project portfolio — where club members publish their best work
            for the institution and industry to see.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-text-muted text-sm">Loading project showcase...</p>
          </div>
        ) : projects.length === 0 ? (
          /* Keep Coming Soon until projects are explicitly published */
          <div className="border border-border rounded-xl p-12 sm:p-16 flex flex-col items-center text-center max-w-2xl mx-auto bg-surface/50">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-6">
              <Layers className="w-7 h-7 text-accent" strokeWidth={1.5} />
            </div>

            <h2 className="text-text-primary font-semibold text-2xl mb-3">
              Club Projects Coming Soon
            </h2>
            <p className="text-text-muted text-base leading-relaxed mb-8 max-w-sm">
              SkyNet's project showcase is currently under development. Projects
              will appear here as they are completed and published by the team.
            </p>

            <div className="w-full border-t border-border pt-8">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-5">
                Projects will include
              </p>
              <ul className="space-y-2">
                {FUTURE_FIELDS.map((f) => (
                  <li
                    key={f}
                    className="text-text-secondary text-sm flex items-center justify-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between hover:border-border-2 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      label={
                        proj.status === 'completed'
                          ? 'Completed'
                          : proj.status === 'in_progress'
                          ? 'In Progress'
                          : 'Published'
                      }
                    />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">{proj.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>
                  {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.technologies.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-2xs bg-surface-2 text-text-secondary border border-border"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-5 border-t border-border mt-5 text-xs">
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-secondary hover:text-accent flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <Github className="w-4 h-4" /> Code
                    </a>
                  )}
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline flex items-center gap-1 font-medium"
                    >
                      Live Demo <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
