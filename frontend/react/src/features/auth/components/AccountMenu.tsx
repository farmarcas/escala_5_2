import { LayoutGrid, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '../hooks/useAuth';

const navLink =
  'text-secondary-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium';

export function AccountMenu() {
  const { state, logout } = useAuth();

  if (state.status === 'loading') return null;

  if (state.status === 'anonymous') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link to="/entrar" className={buttonStyles({ variant: 'ghost', size: 'md' })}>
          Entrar
        </Link>
        <Link to="/cadastrar" className={buttonStyles({ variant: 'outline', size: 'md' })}>
          Criar conta
        </Link>
      </div>
    );
  }

  return (
    <nav aria-label="Conta" className="flex items-center gap-1 sm:gap-2">
      <span className="text-muted-foreground mr-2 hidden text-xs sm:inline">
        {state.group.name}
      </span>
      <Link to="/painel" className={navLink}>
        <Icon icon={LayoutGrid} size={16} />
        Painel
      </Link>
      <Link to="/conta" className={navLink}>
        <Icon icon={UserRound} size={16} />
        Conta
      </Link>
      <Button variant="outline" size="md" onClick={() => void logout()}>
        Sair
      </Button>
    </nav>
  );
}
