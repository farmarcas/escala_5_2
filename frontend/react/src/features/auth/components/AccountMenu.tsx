import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export function AccountMenu() {
  const { state, logout } = useAuth();

  if (state.status === 'loading') return null;

  if (state.status === 'anonymous') {
    return (
      <Link to="/entrar" className="text-sm font-medium underline underline-offset-2">
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden opacity-90 sm:inline">{state.group.name}</span>
      <Link to="/lojas" className="font-medium underline underline-offset-2">
        Minhas lojas
      </Link>
      <Link to="/simulacoes" className="font-medium underline underline-offset-2">
        Simulações
      </Link>
      <Link to="/conta" className="font-medium underline underline-offset-2">
        Conta
      </Link>
      <Button variant="secondary" size="sm" onClick={() => void logout()}>
        Sair
      </Button>
    </div>
  );
}
