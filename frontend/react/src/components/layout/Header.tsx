import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';

type HeaderProps = { actions?: ReactNode };

export function Header({ actions }: HeaderProps) {
  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Radar Escala, página inicial" className="rounded-md">
          <Logo size={28} />
        </Link>
        {actions}
      </div>
    </header>
  );
}
