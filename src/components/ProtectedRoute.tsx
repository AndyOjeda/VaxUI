import { Navigate } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner label="Cargando…" />;
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
