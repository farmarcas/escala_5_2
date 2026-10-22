import type { ReactNode } from 'react';

type EmptyStateProps = { title: string; description?: string; action?: ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="border-border bg-background rounded-lg border border-dashed p-8 text-center">
      <h2 className="text-lg font-bold">{title}</h2>
      {description ? (
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
