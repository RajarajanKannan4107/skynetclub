import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ children }) {
  const { token, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-text-muted text-sm">Verifying administrator authorization...</p>
      </div>
    );
  }

  if (!token || !isAdmin) {
    // Redirect to /admin login preserving target location
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
}
