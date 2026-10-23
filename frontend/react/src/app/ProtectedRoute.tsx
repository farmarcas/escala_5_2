import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth';

export function ProtectedRoute() {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-muted-foreground text-sm">
        Carregando…
      </p>
    );
  }
  if (state.status === 'anonymous') return <Navigate to="/entrar" replace />;
  return <Outlet />;
}
