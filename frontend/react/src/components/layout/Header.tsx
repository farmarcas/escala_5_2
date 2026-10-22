import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type HeaderProps = { actions?: ReactNode };

export function Header({ actions }: HeaderProps) {
  return (
    <header className="bg-foreground text-background">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <Link to="/" className="text-lg font-bold">
          Farmarcas
          <span className="ml-2 hidden text-sm font-normal opacity-90 sm:inline">
            Calculadora do fim da escala 6x1
          </span>
        </Link>
        {actions}
      </div>
    </header>
  );
}
