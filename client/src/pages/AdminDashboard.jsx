import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  ClipboardList,
  Users,
  Layers,
  Settings,
  LogOut,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Check,
  X,
  FileDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminTasks,
  createAdminTask,
  updateAdminTask,
  updateAdminTaskStatus,
  deleteAdminTask,
  getAdminSubmissions,
  getAdminSubmissionById,
  updateAdminSubmissionStatus,
  deleteAdminSubmission,
  getProjects,
  createAdminProject,
  updateAdminProject,
  deleteAdminProject,
  checkBackendHealth,
} from '../services/api';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import ConfirmModal from '../components/ui/ConfirmModal';
import FormBuilder from '../components/admin/FormBuilder';

const DOMAINS = [
  'Web Development',
  'AI/ML',
  'Competitive Programming',
  'Content & Design',
  'PR & Marketing',
];

const TASK_DOMAINS = [...DOMAINS, 'All'];

const TASK_STATUSES = ['draft', 'published', 'archived'];

const SUBMISSION_STATUSES = ['submitted', 'under_review', 'accepted', 'rejected'];

const PROJECT_STATUSES = ['coming_soon', 'in_progress', 'completed', 'archived'];

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();

  // Navigation State
  const [activeSection, setActiveSection] = useState('overview'); // overview, tasks, submissions, projects, settings
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Data State
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  // Modals & Active Items
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = new, or task object
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigned_domain: 'Web Development',
    week_number: 1,
    deadline: '',
    status: 'draft',
    submission_schema: [],
  });

  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    technologies: '',
    github_url: '',
    demo_url: '',
    status: 'coming_soon',
  });

  // Confirmation Modals
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false,
  });

  // Filter States for Tasks
  const [taskDomainFilter, setTaskDomainFilter] = useState('All');
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');

  // Filter States for Submissions
  const [subTaskFilter, setSubTaskFilter] = useState('All');
  const [subDomainFilter, setSubDomainFilter] = useState('All');
  const [subStatusFilter, setSubStatusFilter] = useState('All');
  const [subSearch, setSubSearch] = useState('');
  const [subDeptFilter, setSubDeptFilter] = useState('');
  const [subSectionFilter, setSubSectionFilter] = useState('');

  // Settings State
  const [healthStatus, setHealthStatus] = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================

  const fetchAllData = useCallback(async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      const [tasksRes, subsRes, projRes] = await Promise.all([
        getAdminTasks(token).catch((err) => ({ data: [], error: err.message })),
        getAdminSubmissions(token).catch((err) => ({ data: [], error: err.message })),
        getProjects().catch((err) => ({ data: [], error: err.message })),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (subsRes.data) setSubmissions(subsRes.data);
      if (projRes.data) setProjects(projRes.data);
    } catch (err) {
      showToast('error', `Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ===========================================================================
  // TASK ACTIONS
  // ===========================================================================

  const openCreateTask = () => {
    const nextWeek = tasks.length > 0 ? Math.max(...tasks.map((t) => t.week_number || 1)) + 1 : 1;
    // Default deadline 7 days in future formatted for datetime-local
    const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);

    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      assigned_domain: 'Web Development',
      week_number: nextWeek,
      deadline: defaultDeadline,
      status: 'draft',
      allow_late_submissions: false,
      submission_schema: [],
    });
    setTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      assigned_domain: task.assigned_domain,
      week_number: task.week_number,
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      status: task.status,
      allow_late_submissions: !!task.allow_late_submissions,
      submission_schema: Array.isArray(task.submission_schema) ? task.submission_schema : [],
    });
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return showToast('error', 'Task title is required.');
    if (!taskForm.description.trim()) return showToast('error', 'Task description is required.');
    if (!taskForm.deadline) return showToast('error', 'Task deadline is required.');

    try {
      const payload = {
        ...taskForm,
        allow_late_submissions: !!taskForm.allow_late_submissions,
        week_number: parseInt(taskForm.week_number, 10),
        deadline: new Date(taskForm.deadline).toISOString(),
      };

      if (editingTask) {
        await updateAdminTask(token, editingTask.id, payload);
        showToast('success', `Task "${taskForm.title}" updated successfully.`);
      } else {
        await createAdminTask(token, payload);
        showToast('success', `Task "${taskForm.title}" created successfully.`);
      }

      setTaskModalOpen(false);
      fetchAllData();
    } catch (err) {
      showToast('error', err.message || 'Failed to save task.');
    }
  };

  const handleToggleTaskStatus = async (task, newStatus) => {
    try {
      await updateAdminTaskStatus(token, task.id, newStatus);
      showToast('success', `Task status changed to ${newStatus}.`);
      fetchAllData();
    } catch (err) {
      showToast('error', err.message || 'Failed to update task status.');
    }
  };

  const handleDeleteTask = (task) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Task: ${task.title}?`,
      message: `Are you sure you want to delete Week ${task.week_number} "${task.title}"? Any associated member submissions will also be deleted.`,
      onConfirm: async () => {
        try {
          await deleteAdminTask(token, task.id);
          showToast('success', 'Task deleted successfully.');
          fetchAllData();
        } catch (err) {
          showToast('error', err.message || 'Failed to delete task.');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ===========================================================================
  // SUBMISSION ACTIONS
  // ===========================================================================

  const openSubmissionDetails = async (sub) => {
    setSelectedSubmission(sub);
    setSubmissionModalOpen(true);
    setLoadingSubmissionDetail(true);

    try {
      // Fetch full details with signed URLs for files
      const res = await getAdminSubmissionById(token, sub.id);
      if (res.success && res.data) {
        setSelectedSubmission(res.data);
      }
    } catch (err) {
      showToast('error', `Could not fetch submission details: ${err.message}`);
    } finally {
      setLoadingSubmissionDetail(false);
    }
  };

  const handleUpdateSubmissionStatus = async (subId, newStatus) => {
    try {
      await updateAdminSubmissionStatus(token, subId, newStatus);
      showToast('success', `Submission marked as ${newStatus}.`);
      setSelectedSubmission((prev) => (prev ? { ...prev, submission_status: newStatus } : null));
      fetchAllData();
    } catch (err) {
      showToast('error', err.message || 'Failed to update submission status.');
    }
  };

  const handleDeleteSubmission = (sub) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete submission from ${sub.member_name}?`,
      message: 'This will delete the submission record and any uploaded files permanently.',
      onConfirm: async () => {
        try {
          await deleteAdminSubmission(token, sub.id);
          showToast('success', 'Submission deleted.');
          setSubmissionModalOpen(false);
          fetchAllData();
        } catch (err) {
          showToast('error', err.message || 'Failed to delete submission.');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // CSV Export for Submissions
  const exportSubmissionsToCSV = () => {
    if (filteredSubmissions.length === 0) {
      return showToast('error', 'No submissions match current filters to export.');
    }

    const headers = [
      'Submission ID',
      'Submitted At',
      'Member Name',
      'Member Email',
      'Department',
      'Year',
      'Section',
      'Club Domain',
      'Task ID',
      'Task Title',
      'Status',
      'Submission Data JSON',
    ];

    const rows = filteredSubmissions.map((s) => [
      `"${s.id}"`,
      `"${new Date(s.submitted_at).toISOString()}"`,
      `"${(s.member_name || '').replace(/"/g, '""')}"`,
      `"${(s.member_email || '').replace(/"/g, '""')}"`,
      `"${(s.department || '').replace(/"/g, '""')}"`,
      `"${(s.year || '').replace(/"/g, '""')}"`,
      `"${(s.section || '').replace(/"/g, '""')}"`,
      `"${(s.club_domain || '').replace(/"/g, '""')}"`,
      `"${s.task_id}"`,
      `"${(s.weekly_tasks?.title || '').replace(/"/g, '""')}"`,
      `"${s.submission_status}"`,
      `"${JSON.stringify(s.submission_data || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `skynet_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', `Exported ${filteredSubmissions.length} submissions to CSV.`);
  };

  // ===========================================================================
  // PROJECT ACTIONS
  // ===========================================================================

  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm({
      title: '',
      description: '',
      technologies: '',
      github_url: '',
      demo_url: '',
      status: 'coming_soon',
    });
    setProjectModalOpen(true);
  };

  const openEditProject = (proj) => {
    setEditingProject(proj);
    setProjectForm({
      title: proj.title,
      description: proj.description,
      technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : '',
      github_url: proj.github_url || '',
      demo_url: proj.demo_url || '',
      status: proj.status,
    });
    setProjectModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return showToast('error', 'Project title is required.');
    if (!projectForm.description.trim()) return showToast('error', 'Project description is required.');

    try {
      const payload = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        technologies: projectForm.technologies
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        github_url: projectForm.github_url.trim() || null,
        demo_url: projectForm.demo_url.trim() || null,
        status: projectForm.status,
      };

      if (editingProject) {
        await updateAdminProject(token, editingProject.id, payload);
        showToast('success', `Project "${projectForm.title}" updated.`);
      } else {
        await createAdminProject(token, payload);
        showToast('success', `Project "${projectForm.title}" created.`);
      }

      setProjectModalOpen(false);
      fetchAllData();
    } catch (err) {
      showToast('error', err.message || 'Failed to save project.');
    }
  };

  const handleDeleteProject = (proj) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Project: ${proj.title}?`,
      message: 'Are you sure you want to delete this project entry?',
      onConfirm: async () => {
        try {
          await deleteAdminProject(token, proj.id);
          showToast('success', 'Project deleted.');
          fetchAllData();
        } catch (err) {
          showToast('error', err.message || 'Failed to delete project.');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ===========================================================================
  // FILTERED DATA
  // ===========================================================================

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskDomainFilter !== 'All' && t.assigned_domain !== taskDomainFilter) return false;
      if (taskStatusFilter !== 'All' && t.status !== taskStatusFilter) return false;
      return true;
    });
  }, [tasks, taskDomainFilter, taskStatusFilter]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (subTaskFilter !== 'All' && s.task_id !== subTaskFilter) return false;
      if (subDomainFilter !== 'All' && s.club_domain !== subDomainFilter) return false;
      if (subStatusFilter !== 'All' && s.submission_status !== subStatusFilter) return false;
      if (subDeptFilter && !s.department?.toLowerCase().includes(subDeptFilter.toLowerCase()))
        return false;
      if (subSectionFilter && !s.section?.toLowerCase().includes(subSectionFilter.toLowerCase()))
        return false;
      if (subSearch && !s.member_name?.toLowerCase().includes(subSearch.toLowerCase()))
        return false;
      return true;
    });
  }, [submissions, subTaskFilter, subDomainFilter, subStatusFilter, subDeptFilter, subSectionFilter, subSearch]);

  // Real statistics derived from live data
  const stats = useMemo(() => {
    const publishedTasksCount = tasks.filter((t) => t.status === 'published').length;
    const pendingReviewsCount = submissions.filter((s) => s.submission_status === 'submitted').length;

    const domainCounts = {};
    DOMAINS.forEach((d) => {
      domainCounts[d] = submissions.filter((s) => s.club_domain === d).length;
    });

    return {
      totalTasks: tasks.length,
      publishedTasks: publishedTasksCount,
      totalSubmissions: submissions.length,
      pendingReviews: pendingReviewsCount,
      totalProjects: projects.length,
      domainCounts,
    };
  }, [tasks, submissions, projects]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-slide-up ${
            toast.type === 'success'
              ? 'bg-surface border-accent/40 text-text-primary'
              : 'bg-red-950/90 border-red-800 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-accent shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4 bg-background sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 text-text-muted hover:text-text-secondary transition-colors"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-accent/10 border border-accent/30 group-hover:bg-accent/20 transition-colors">
              <Zap className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
            </div>
            <span className="text-text-primary font-semibold text-sm">
              Sky<span className="text-accent">Net</span>
            </span>
          </Link>
          <span className="text-border text-xs hidden sm:inline">/</span>
          <span className="text-text-muted text-xs hidden sm:inline font-mono">
            Admin Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-surface-2 rounded transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
            <span className="hidden md:inline">Sync</span>
          </button>

          <Link
            to="/"
            target="_blank"
            className="text-text-muted text-xs hover:text-text-secondary transition-colors hidden sm:flex items-center gap-1"
          >
            Public Site
            <ExternalLink className="w-3 h-3" />
          </Link>

          <div className="w-px h-4 bg-border" />

          {/* User profile pill */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-2xs font-bold">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
            </div>
            <span className="text-xs text-text-secondary font-medium hidden md:inline">
              {user?.email || 'admin'}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-60 bg-background border-r border-border
            flex flex-col pt-4 pb-6 transition-transform duration-200
            lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/60 -z-10"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="px-4 mb-4">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
              Navigation
            </span>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'tasks', label: 'Weekly Tasks', icon: ClipboardList, count: tasks.length },
              {
                id: 'submissions',
                label: 'Task Submissions',
                icon: Users,
                count: stats.pendingReviews > 0 ? stats.pendingReviews : submissions.length,
                badgeVariant: stats.pendingReviews > 0 ? 'alert' : 'default',
              },
              { id: 'projects', label: 'Projects', icon: Layers, count: projects.length },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon, count, badgeVariant }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveSection(id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                  activeSection === id
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>{label}</span>
                </div>
                {count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-2xs font-mono ${
                      badgeVariant === 'alert'
                        ? 'bg-orange-500/20 text-orange-400 font-bold'
                        : 'bg-surface-3 text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="px-4 pt-4 border-t border-border mt-auto">
            <p className="text-2xs text-text-muted leading-relaxed">
              SRM IST Ramapuram
              <br />
              <span className="text-accent">SkyNet Operations</span>
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Spinner size="lg" />
              <p className="text-text-muted text-sm">Loading SkyNet records from Supabase...</p>
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* 1. OVERVIEW SECTION */}
              {/* ============================================================== */}
              {activeSection === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                      Platform Overview
                    </h2>
                    <p className="text-text-muted text-sm mt-1">
                      Real-time operational summary from Supabase database.
                    </p>
                  </div>

                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-2 transition-colors">
                      <div className="flex items-center justify-between text-text-muted text-xs font-medium mb-3">
                        <span>Weekly Tasks</span>
                        <ClipboardList className="w-4 h-4 text-accent" />
                      </div>
                      <p className="text-3xl font-bold text-text-primary">{stats.totalTasks}</p>
                      <p className="text-2xs text-text-muted mt-2">
                        {stats.publishedTasks} published • {stats.totalTasks - stats.publishedTasks} drafts
                      </p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-2 transition-colors">
                      <div className="flex items-center justify-between text-text-muted text-xs font-medium mb-3">
                        <span>Total Submissions</span>
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <p className="text-3xl font-bold text-text-primary">{stats.totalSubmissions}</p>
                      <p className="text-2xs text-text-muted mt-2">
                        Across all active weekly assignments
                      </p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-2 transition-colors">
                      <div className="flex items-center justify-between text-text-muted text-xs font-medium mb-3">
                        <span>Pending Reviews</span>
                        <Clock className="w-4 h-4 text-orange-400" />
                      </div>
                      <p className="text-3xl font-bold text-orange-400">{stats.pendingReviews}</p>
                      <p className="text-2xs text-text-muted mt-2">
                        Requires evaluation by administrators
                      </p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-2 transition-colors">
                      <div className="flex items-center justify-between text-text-muted text-xs font-medium mb-3">
                        <span>Club Projects</span>
                        <Layers className="w-4 h-4 text-accent" />
                      </div>
                      <p className="text-3xl font-bold text-text-primary">{stats.totalProjects}</p>
                      <p className="text-2xs text-text-muted mt-2">
                        Showcase items in database
                      </p>
                    </div>
                  </div>

                  {/* Domain Submissions Breakdown */}
                  <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="text-base font-bold text-text-primary mb-4">
                      Submissions by Technical Domain
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                      {DOMAINS.map((domain) => {
                        const count = stats.domainCounts[domain] || 0;
                        return (
                          <div
                            key={domain}
                            className="bg-surface-2/60 border border-border p-3.5 rounded-lg flex flex-col justify-between"
                          >
                            <Badge label={domain} />
                            <div className="mt-3">
                              <span className="text-2xl font-bold text-text-primary">{count}</span>
                              <span className="text-2xs text-text-muted block">submissions</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Action Shortcuts */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button variant="primary" size="md" onClick={openCreateTask}>
                      <Plus className="w-4 h-4" /> Create Weekly Task
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setActiveSection('submissions')}
                    >
                      <Users className="w-4 h-4" /> Review Submissions ({stats.pendingReviews})
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setActiveSection('projects')}
                    >
                      <Layers className="w-4 h-4" /> Manage Projects
                    </Button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 2. WEEKLY TASKS MANAGEMENT SECTION */}
              {/* ============================================================== */}
              {activeSection === 'tasks' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                        Weekly Tasks Management
                      </h2>
                      <p className="text-text-muted text-sm mt-1">
                        Configure weekly challenges with the dynamic submission form builder.
                      </p>
                    </div>

                    <Button variant="primary" size="md" onClick={openCreateTask}>
                      <Plus className="w-4 h-4" /> New Weekly Task
                    </Button>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-surface border border-border rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Filter className="w-3.5 h-3.5" /> Filter:
                    </div>

                    {/* Domain Filter */}
                    <select
                      value={taskDomainFilter}
                      onChange={(e) => setTaskDomainFilter(e.target.value)}
                      className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
                    >
                      <option value="All">All Domains</option>
                      {TASK_DOMAINS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    {/* Status Filter */}
                    <select
                      value={taskStatusFilter}
                      onChange={(e) => setTaskStatusFilter(e.target.value)}
                      className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
                    >
                      <option value="All">All Statuses</option>
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    <div className="sm:ml-auto text-2xs text-text-muted">
                      Showing {filteredTasks.length} of {tasks.length} tasks
                    </div>
                  </div>

                  {/* Tasks Table / Cards */}
                  {filteredTasks.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-12 text-center bg-surface-2/20">
                      <ClipboardList className="w-10 h-10 text-text-muted mx-auto mb-3" />
                      <h4 className="text-text-primary font-semibold text-base mb-1">
                        No Tasks Found
                      </h4>
                      <p className="text-text-muted text-xs max-w-sm mx-auto mb-5 leading-relaxed">
                        {taskDomainFilter !== 'All' || taskStatusFilter !== 'All'
                          ? 'No tasks match your selected filter criteria.'
                          : 'Create your first weekly task to publish assignments for members.'}
                      </p>
                      <Button variant="primary" size="sm" onClick={openCreateTask}>
                        <Plus className="w-3.5 h-3.5" /> Create Weekly Task
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTasks.map((task) => {
                        const isExpired = task.deadline && new Date(task.deadline) < new Date();
                        const schemaCount = Array.isArray(task.submission_schema)
                          ? task.submission_schema.length
                          : 0;

                        return (
                          <div
                            key={task.id}
                            className="bg-surface border border-border rounded-xl p-5 hover:border-border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-accent/15 text-accent border border-accent/30">
                                  WEEK {task.week_number}
                                </span>
                                <Badge label={task.assigned_domain} />
                                <span
                                  className={`px-2 py-0.5 rounded text-2xs font-semibold uppercase ${
                                    task.status === 'published'
                                      ? 'bg-green-950/60 text-green-400 border border-green-800'
                                      : task.status === 'draft'
                                      ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-800'
                                      : 'bg-surface-3 text-text-muted border border-border'
                                  }`}
                                >
                                  {task.status}
                                </span>
                                {isExpired && (
                                  <span className="px-2 py-0.5 rounded text-2xs font-semibold uppercase bg-red-950/60 text-red-400 border border-red-800">
                                    Expired
                                  </span>
                                )}
                                {task.allow_late_submissions ? (
                                  <span className="px-2 py-0.5 rounded text-2xs font-semibold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                                    Late Allowed
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-2xs font-semibold uppercase bg-surface-3 text-text-muted border border-border">
                                    Strict Deadline
                                  </span>
                                )}
                              </div>

                              <h3 className="text-base font-bold text-text-primary leading-snug">
                                {task.title}
                              </h3>

                              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-2xs text-text-muted pt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Deadline: {new Date(task.deadline).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-mono text-accent">
                                  <FileText className="w-3.5 h-3.5" />
                                  {schemaCount} dynamic fields configured
                                </span>
                              </div>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                              {/* Status Toggle Button */}
                              {task.status === 'draft' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleToggleTaskStatus(task, 'published')}
                                >
                                  <Check className="w-3.5 h-3.5" /> Publish
                                </Button>
                              )}
                              {task.status === 'published' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleToggleTaskStatus(task, 'draft')}
                                >
                                  Unpublish
                                </Button>
                              )}

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditTask(task)}
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </Button>

                              <button
                                onClick={() => handleDeleteTask(task)}
                                className="p-2 text-text-muted hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* 3. TASK SUBMISSIONS MANAGEMENT SECTION */}
              {/* ============================================================== */}
              {activeSection === 'submissions' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                        Task Submissions
                      </h2>
                      <p className="text-text-muted text-sm mt-1">
                        Review, evaluate, and securely inspect member dynamic submissions.
                      </p>
                    </div>

                    <Button variant="secondary" size="md" onClick={exportSubmissionsToCSV}>
                      <Download className="w-4 h-4" /> Export CSV
                    </Button>
                  </div>

                  {/* Filter Bar */}
                  <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Search member name */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-text-muted" />
                        <input
                          type="text"
                          placeholder="Search member name..."
                          value={subSearch}
                          onChange={(e) => setSubSearch(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none"
                        />
                      </div>

                      {/* Filter by Task */}
                      <select
                        value={subTaskFilter}
                        onChange={(e) => setSubTaskFilter(e.target.value)}
                        className="bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
                      >
                        <option value="All">All Weekly Tasks</option>
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            Week {t.week_number}: {t.title}
                          </option>
                        ))}
                      </select>

                      {/* Filter by Domain */}
                      <select
                        value={subDomainFilter}
                        onChange={(e) => setSubDomainFilter(e.target.value)}
                        className="bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
                      >
                        <option value="All">All Domains</option>
                        {DOMAINS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      {/* Filter by Status */}
                      <select
                        value={subStatusFilter}
                        onChange={(e) => setSubStatusFilter(e.target.value)}
                        className="bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
                      >
                        <option value="All">All Statuses</option>
                        {SUBMISSION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
                      <input
                        type="text"
                        placeholder="Filter by Department (e.g. CSE, IT)..."
                        value={subDeptFilter}
                        onChange={(e) => setSubDeptFilter(e.target.value)}
                        className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Filter by Section (e.g. A, B)..."
                        value={subSectionFilter}
                        onChange={(e) => setSubSectionFilter(e.target.value)}
                        className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none"
                      />
                    </div>
                  </div>

                  {/* Submissions Table */}
                  {filteredSubmissions.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-12 text-center bg-surface-2/20">
                      <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
                      <h4 className="text-text-primary font-semibold text-base mb-1">
                        No Submissions Found
                      </h4>
                      <p className="text-text-muted text-xs max-w-sm mx-auto leading-relaxed">
                        No member submissions match your active filter parameters.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl overflow-hidden bg-surface">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-surface-2 border-b border-border text-text-muted uppercase text-2xs font-semibold">
                            <tr>
                              <th className="py-3 px-4">Member Name</th>
                              <th className="py-3 px-4">Dept / Year / Sec</th>
                              <th className="py-3 px-4">Club Domain</th>
                              <th className="py-3 px-4">Task</th>
                              <th className="py-3 px-4">Submitted At</th>
                              <th className="py-3 px-4">Review Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filteredSubmissions.map((sub) => (
                              <tr key={sub.id} className="hover:bg-surface-2/50 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-text-primary">
                                  <div>{sub.member_name}</div>
                                  {sub.member_email && (
                                    <div className="text-2xs text-text-muted font-normal font-mono">{sub.member_email}</div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-text-secondary font-mono">
                                  {sub.department} • {sub.year} • Sec {sub.section}
                                </td>
                                <td className="py-3.5 px-4">
                                  <Badge label={sub.club_domain} />
                                </td>
                                <td className="py-3.5 px-4 text-text-secondary font-medium max-w-xs truncate">
                                  {sub.weekly_tasks?.title || 'Task'}
                                </td>
                                <td className="py-3.5 px-4 text-text-muted text-2xs">
                                  {new Date(sub.submitted_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-2xs font-semibold uppercase ${
                                      sub.submission_status === 'accepted'
                                        ? 'bg-green-950/60 text-green-400 border border-green-800'
                                        : sub.submission_status === 'under_review'
                                        ? 'bg-blue-950/60 text-blue-400 border border-blue-800'
                                        : sub.submission_status === 'rejected'
                                        ? 'bg-red-950/60 text-red-400 border border-red-800'
                                        : 'bg-yellow-950/60 text-yellow-400 border border-yellow-800'
                                    }`}
                                  >
                                    {sub.submission_status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openSubmissionDetails(sub)}
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Inspect
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* 4. PROJECT MANAGEMENT SECTION */}
              {/* ============================================================== */}
              {activeSection === 'projects' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                        Projects Showcase Management
                      </h2>
                      <p className="text-text-muted text-sm mt-1">
                        Curate club technical projects. Public page stays on "Coming Soon" until projects are published.
                      </p>
                    </div>

                    <Button variant="primary" size="md" onClick={openCreateProject}>
                      <Plus className="w-4 h-4" /> Add Project
                    </Button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-12 text-center bg-surface-2/20">
                      <Layers className="w-10 h-10 text-text-muted mx-auto mb-3" />
                      <h4 className="text-text-primary font-semibold text-base mb-1">
                        No Projects in Database
                      </h4>
                      <p className="text-text-muted text-xs max-w-sm mx-auto mb-5 leading-relaxed">
                        Add completed or active club projects. Public visitors currently see "Club Projects Coming Soon".
                      </p>
                      <Button variant="primary" size="sm" onClick={openCreateProject}>
                        <Plus className="w-3.5 h-3.5" /> Create Project
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map((proj) => (
                        <div
                          key={proj.id}
                          className="bg-surface border border-border rounded-xl p-5 hover:border-border-2 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-2 py-0.5 rounded text-2xs font-semibold uppercase ${
                                  proj.status === 'completed'
                                    ? 'bg-green-950/60 text-green-400 border border-green-800'
                                    : proj.status === 'in_progress'
                                    ? 'bg-blue-950/60 text-blue-400 border border-blue-800'
                                    : 'bg-surface-3 text-text-muted border border-border'
                                }`}
                              >
                                {proj.status.replace('_', ' ')}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditProject(proj)}
                                  className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(proj)}
                                  className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h3 className="text-base font-bold text-text-primary">{proj.title}</h3>

                            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                              {proj.description}
                            </p>

                            {/* Tech Tags */}
                            {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {proj.technologies.map((t) => (
                                  <span
                                    key={t}
                                    className="px-2 py-0.5 bg-surface-2 rounded text-2xs text-text-secondary border border-border"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Links */}
                          <div className="flex items-center gap-3 pt-4 border-t border-border mt-4 text-xs">
                            {proj.github_url && (
                              <a
                                href={proj.github_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent hover:underline flex items-center gap-1 text-2xs"
                              >
                                GitHub <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {proj.demo_url && (
                              <a
                                href={proj.demo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent hover:underline flex items-center gap-1 text-2xs"
                              >
                                Live Demo <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* 5. SETTINGS SECTION */}
              {/* ============================================================== */}
              {activeSection === 'settings' && (
                <div className="space-y-6 max-w-3xl animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                      System & Account Settings
                    </h2>
                    <p className="text-text-muted text-sm mt-1">
                      Administrator profile and Supabase infrastructure connectivity.
                    </p>
                  </div>

                  {/* Profile Card */}
                  <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                    <h3 className="text-base font-bold text-text-primary">
                      Administrator Profile
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-surface-2 rounded border border-border">
                        <span className="text-text-muted block text-2xs">Account Email</span>
                        <span className="text-text-primary font-mono font-medium">
                          {user?.email || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-surface-2 rounded border border-border">
                        <span className="text-text-muted block text-2xs">Assigned Role</span>
                        <span className="text-accent font-bold uppercase">{user?.role || 'admin'}</span>
                      </div>
                      <div className="sm:col-span-2 p-3 bg-surface-2 rounded border border-border">
                        <span className="text-text-muted block text-2xs">User UUID</span>
                        <span className="text-text-secondary font-mono text-2xs break-all">
                          {user?.id || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Connectivity & Health Card */}
                  <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-text-primary">
                        Backend & Database Health
                      </h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await checkBackendHealth();
                            setHealthStatus(res);
                            showToast('success', 'Backend health confirmed.');
                          } catch (err) {
                            showToast('error', `Backend check failed: ${err.message}`);
                          }
                        }}
                      >
                        Ping API
                      </Button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-3 bg-surface-2 rounded border border-border">
                        <span className="text-text-secondary">Node.js Express API</span>
                        <span className="text-green-400 font-mono flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          ONLINE
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-surface-2 rounded border border-border">
                        <span className="text-text-secondary">Supabase PostgreSQL & Auth</span>
                        <span className="text-green-400 font-mono flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          CONNECTED (RLS ENFORCED)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-surface-2 rounded border border-border">
                        <span className="text-text-secondary">Private Submissions Storage</span>
                        <span className="text-accent font-mono">task-submissions (Active)</span>
                      </div>
                    </div>
                  </div>

                  {/* Session Sign Out */}
                  <div className="pt-2">
                    <Button variant="secondary" size="md" onClick={logout} className="text-red-400">
                      <LogOut className="w-4 h-4" /> End Administrator Session
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ===================================================================== */}
      {/* TASK CREATE / EDIT MODAL WITH DYNAMIC FORM BUILDER */}
      {/* ===================================================================== */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto"
      >
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-xl font-bold text-text-primary">
              {editingTask ? `Edit Task: ${editingTask.title}` : 'Create New Weekly Task'}
            </h3>
            <p className="text-text-muted text-xs mt-1">
              Configure assignment deliverables and design the dynamic member submission form.
            </p>
          </div>

          <form onSubmit={handleSaveTask} className="space-y-6">
            {/* Core Task Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Build an Algorithmic Search Visualizer"
                  className="w-full bg-surface-2 border border-border rounded px-3.5 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Description & Guidelines <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Detailed guidelines, objectives, and evaluation criteria for members..."
                  className="w-full bg-surface-2 border border-border rounded px-3.5 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Assigned Domain <span className="text-red-400">*</span>
                </label>
                <select
                  value={taskForm.assigned_domain}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_domain: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded px-3.5 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
                >
                  {TASK_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Week Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={taskForm.week_number}
                  onChange={(e) => setTaskForm({ ...taskForm, week_number: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded px-3.5 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Submission Deadline <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded px-3.5 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Publication Status
                </label>
                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded px-3.5 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none font-mono"
                >
                  <option value="draft">DRAFT (Hidden from public)</option>
                  <option value="published">PUBLISHED (Active for members)</option>
                  <option value="archived">ARCHIVED</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="allow_late_submissions"
                  checked={taskForm.allow_late_submissions || false}
                  onChange={(e) => setTaskForm({ ...taskForm, allow_late_submissions: e.target.checked })}
                  className="rounded border-border bg-surface-2 text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                />
                <label htmlFor="allow_late_submissions" className="text-xs text-text-secondary cursor-pointer select-none">
                  Allow late submissions past deadline <span className="text-text-muted">(members can still submit after the deadline expires)</span>
                </label>
              </div>
            </div>

            {/* DYNAMIC SUBMISSION FORM BUILDER */}
            <div className="pt-4 border-t border-border space-y-4">
              <div>
                <h4 className="text-base font-bold text-text-primary">
                  Dynamic Member Submission Form Builder
                </h4>
                <p className="text-text-muted text-xs mt-0.5">
                  Define deliverables members must submit. Rearrange fields, configure types, and set validations.
                </p>
              </div>

              <FormBuilder
                schema={taskForm.submission_schema}
                onChange={(newSchema) => setTaskForm({ ...taskForm, submission_schema: newSchema })}
                taskTitle={taskForm.title || 'Weekly Task Deliverables'}
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" size="md" onClick={() => setTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                {editingTask ? 'Save Task Changes' : 'Create Weekly Task'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* SUBMISSION INSPECTION MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={submissionModalOpen}
        onClose={() => setSubmissionModalOpen(false)}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-border pb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge label={selectedSubmission?.club_domain || 'Domain'} />
                <span className="text-2xs font-mono text-text-muted">
                  ID: {selectedSubmission?.id?.slice(0, 8)}...
                </span>
              </div>
              <h3 className="text-xl font-bold text-text-primary">
                {selectedSubmission?.member_name}
              </h3>
              <p className="text-text-muted text-xs mt-0.5 font-mono">
                {selectedSubmission?.member_email && <span className="text-accent font-semibold">{selectedSubmission.member_email} • </span>}
                {selectedSubmission?.department} • {selectedSubmission?.year} • Section{' '}
                {selectedSubmission?.section}
              </p>
            </div>

            {/* Status Selector */}
            <div className="text-right">
              <label className="block text-2xs font-medium text-text-muted mb-1">
                Review Status
              </label>
              <select
                value={selectedSubmission?.submission_status || 'submitted'}
                onChange={(e) => handleUpdateSubmissionStatus(selectedSubmission.id, e.target.value)}
                className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary font-semibold uppercase focus:ring-1 focus:ring-accent outline-none"
              >
                {SUBMISSION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingSubmissionDetail ? (
            <div className="py-12 text-center">
              <Spinner size="md" />
              <p className="text-text-muted text-xs mt-2">Loading submission data and secure files...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Task Reference */}
              <div className="p-3.5 bg-surface-2/60 border border-border rounded-lg text-xs space-y-1">
                <span className="text-text-muted text-2xs block uppercase font-mono">
                  Target Task
                </span>
                <p className="text-text-primary font-bold">
                  {selectedSubmission?.weekly_tasks?.title || 'Weekly Task'}
                </p>
                <p className="text-text-muted text-2xs">
                  Submitted at: {new Date(selectedSubmission?.submitted_at).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Dynamic Deliverables */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary border-b border-border/70 pb-2">
                  Dynamic Member Deliverables
                </h4>

                {Object.keys(selectedSubmission?.submission_data || {}).length === 0 ? (
                  <p className="text-text-muted text-xs">No dynamic answers submitted.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(selectedSubmission?.submission_data || {}).map(([key, val]) => {
                      // Check if value is a file upload object
                      const isFile =
                        val && typeof val === 'object' && (val.storage_path || val.file_name);

                      return (
                        <div
                          key={key}
                          className="p-3.5 bg-surface-2 rounded-lg border border-border/70 space-y-1"
                        >
                          <span className="text-2xs font-mono text-accent uppercase block">
                            {key.replace(/_/g, ' ')}
                          </span>

                          {isFile ? (
                            <div className="flex items-center justify-between gap-3 pt-1">
                              <div className="flex items-center gap-2">
                                <FileDown className="w-5 h-5 text-accent shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-text-primary">
                                    {val.file_name || 'Uploaded File'}
                                  </p>
                                  <p className="text-2xs text-text-muted font-mono">
                                    {Math.round((val.file_size || 0) / 1024)} KB • {val.mime_type}
                                  </p>
                                </div>
                              </div>
                              {val.download_url ? (
                                <a
                                  href={val.download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download
                                </a>
                              ) : (
                                <span className="text-2xs text-text-muted">Private Storage</span>
                              )}
                            </div>
                          ) : typeof val === 'boolean' ? (
                            <p className="text-xs font-medium text-text-primary">
                              {val ? 'Agreed / Confirmed' : 'False'}
                            </p>
                          ) : String(val).startsWith('http') ? (
                            <a
                              href={String(val)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-mono text-accent hover:underline flex items-center gap-1 break-all"
                            >
                              {String(val)} <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                              {String(val)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSubmission(selectedSubmission)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" /> Delete Submission
                </Button>

                <Button variant="secondary" size="sm" onClick={() => setSubmissionModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* PROJECT CREATE / EDIT MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        className="w-full max-w-xl"
      >
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-xl font-bold text-text-primary">
              {editingProject ? 'Edit Club Project' : 'Add Club Project'}
            </h3>
            <p className="text-text-muted text-xs mt-1">
              Curate portfolio projects. Public page displays "Coming Soon" unless active projects exist.
            </p>
          </div>

          <form onSubmit={handleSaveProject} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Project Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                placeholder="e.g. Campus Navigation AI"
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Brief summary of the project scope, engineering, and impact..."
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Technologies (comma separated)
              </label>
              <input
                type="text"
                value={projectForm.technologies}
                onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                placeholder="e.g. React, Node.js, PyTorch, Supabase"
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={projectForm.github_url}
                  onChange={(e) => setProjectForm({ ...projectForm, github_url: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Live Demo URL
                </label>
                <input
                  type="url"
                  value={projectForm.demo_url}
                  onChange={(e) => setProjectForm({ ...projectForm, demo_url: e.target.value })}
                  placeholder="https://demo.vercel.app"
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Status
              </label>
              <select
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase().replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" size="md" onClick={() => setProjectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                {editingProject ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        loading={confirmDialog.loading}
      />
    </div>
  );
}
