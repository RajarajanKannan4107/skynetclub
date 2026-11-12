import { useState, useEffect } from 'react';
import TaskCard from '../components/shared/TaskCard';
import SubmissionForm from '../components/shared/SubmissionForm';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getPublishedTasks } from '../services/api';

const DOMAINS = [
  'All',
  'Web Development',
  'AI/ML',
  'Competitive Programming',
  'Content & Design',
  'PR & Marketing',
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [showExpired, setShowExpired] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await getPublishedTasks(selectedDomain);
      if (res.success && Array.isArray(res.data)) {
        // Map database assigned_domain to component domain prop
        const mapped = res.data.map((t) => ({
          ...t,
          domain: t.assigned_domain,
        }));
        setTasks(mapped);
      }
    } catch (err) {
      console.warn('Failed to load published tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedDomain]);

  const now = Date.now();

  const filtered = tasks.filter((t) => {
    const isExpired = t.deadline && new Date(t.deadline).getTime() < now;
    if (!showExpired && isExpired) return false;
    return true;
  });

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">
            Club Tasks
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-4">
            Weekly Tasks
          </h1>
          <p className="text-text-muted text-base max-w-xl">
            Weekly assignments published by SkyNet admins. Submit your deliverables before the
            deadline to log your progress.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Domain filter */}
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDomain(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                  selectedDomain === d
                    ? 'bg-accent/15 border-accent/40 text-accent'
                    : 'bg-surface border-border text-text-muted hover:border-border-2 hover:text-text-secondary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Expired toggle */}
          <div className="sm:ml-auto flex items-center">
            <button
              onClick={() => setShowExpired((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                showExpired
                  ? 'bg-surface-3 border-border-2 text-text-secondary'
                  : 'bg-surface border-border text-text-muted hover:border-border-2 hover:text-text-secondary'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-colors ${
                  showExpired ? 'bg-accent border-accent' : 'border-border-2'
                }`}
              >
                {showExpired && (
                  <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
              Show expired
            </button>
          </div>
        </div>

        {/* Task count */}
        <p className="text-text-muted text-xs mb-6">
          Showing {filtered.length} of {tasks.length} tasks
          {selectedDomain !== 'All' && ` · ${selectedDomain}`}
        </p>

        {/* Task grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-text-muted text-sm">Loading weekly tasks from Supabase...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-border rounded-xl py-16 text-center bg-surface/30">
            <p className="text-text-muted text-base font-medium mb-2">No active tasks</p>
            <p className="text-text-muted text-xs max-w-sm mx-auto">
              {selectedDomain !== 'All'
                ? `No active tasks found for ${selectedDomain}. Check back when admins publish new assignments.`
                : 'No published tasks currently active. Check back soon!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((task) => (
              <TaskCard key={task.id} task={task} onSubmit={setActiveTask} />
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Submission modal */}
      <Modal
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        className="bg-surface border border-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6"
      >
        {activeTask && (
          <SubmissionForm
            task={activeTask}
            onClose={() => setActiveTask(null)}
            onSubmitted={() => {
              fetchTasks();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
