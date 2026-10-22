import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export function AccountMenu() {
  const { state, logout } = useAuth();

  if (state.status === 'loading') return null;

  if (state.status === 'anonymous') {
    return (
      <div className="flex items-center gap-4 text-sm">
        <Link to="/entrar" className="font-medium underline underline-offset-2">
          Entrar
        </Link>
        <Link to="/cadastrar" className="font-medium underline underline-offset-2">
          Criar conta
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden opacity-90 sm:inline">{state.group.name}</span>
      <Link to="/painel" className="font-medium underline underline-offset-2">
        Painel
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
