import { useState, useEffect } from 'react';
import { Lock, Zap, AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (token && isAdmin) {
      const destination = location.state?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    }
  }, [token, isAdmin, navigate, location]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setError('Both email and password are required.');
      return;
    }

    try {
      setLoading(true);
      await login(cleanEmail, password);
      const destination = location.state?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-accent/10 border border-accent/30 group-hover:bg-accent/20 transition-colors">
            <Zap className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
          </div>
          <span className="text-text-primary font-semibold text-sm tracking-tight">
            Sky<span className="text-accent">Net</span>
          </span>
        </Link>
        <span className="text-text-muted text-xs font-mono uppercase tracking-widest">
          Admin Portal
        </span>
      </div>

      {/* Centered login card */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="w-10 h-10 rounded bg-surface-2 border border-border flex items-center justify-center mb-5">
              <Lock className="w-5 h-5 text-accent" strokeWidth={1.75} />
            </div>
            <h1 className="text-text-primary font-bold text-2xl tracking-tight mb-1.5">
              Admin Sign In
            </h1>
            <p className="text-text-muted text-sm leading-relaxed">
              Restricted portal. Authenticate with your authorized SkyNet administrator credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-950/40 border border-red-900/50 rounded text-left animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-text-secondary mb-1.5"
              >
                Administrator Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@skynet.com"
                className="w-full bg-surface-2 border border-border rounded px-3 py-2.5
                           text-sm text-text-primary placeholder:text-text-muted
                           focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                           transition-colors"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-text-secondary mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-surface-2 border border-border rounded px-3 py-2.5
                           text-sm text-text-primary placeholder:text-text-muted
                           focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                           transition-colors"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-text-muted text-xs leading-relaxed">
              Admin privileges are mapped in Supabase Auth & PostgreSQL RBAC.
              <br />
              Public self-registration is strictly disabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
