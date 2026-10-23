import type { ReactNode } from 'react';

type EmptyStateProps = { title: string; description?: string; action?: ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="border-input bg-surface rounded-lg border border-dashed p-8 text-center">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="text-secondary-foreground mx-auto mt-2 max-w-md text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
