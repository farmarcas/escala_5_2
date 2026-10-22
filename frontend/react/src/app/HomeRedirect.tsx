import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';

// Só quem está logado usa o painel: não há página inicial pública.
export function HomeRedirect() {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-muted-foreground text-sm">
        Carregando…
      </p>
    );
  }
  return <Navigate to={state.status === 'authenticated' ? '/lojas' : '/entrar'} replace />;
}
