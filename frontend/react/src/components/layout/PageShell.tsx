import type { ReactNode } from 'react';
import { Header } from './Header';

type PageShellProps = { headerActions?: ReactNode; children: ReactNode };

export function PageShell({ headerActions, children }: PageShellProps) {
  return (
    <div className="bg-background min-h-screen">
      <Header actions={headerActions} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
