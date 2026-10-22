import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <section className="bg-background border-border mx-auto flex w-full max-w-md flex-col gap-4 rounded-lg border p-6">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
      </div>
      {children}
      {footer ? <div className="text-muted-foreground text-sm">{footer}</div> : null}
    </section>
  );
}
