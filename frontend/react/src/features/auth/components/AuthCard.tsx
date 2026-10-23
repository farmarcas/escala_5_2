import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <section className="bg-surface border-border mx-auto flex w-full max-w-md flex-col gap-5 rounded-lg border p-6 sm:p-8">
      <div>
        <h1 className="font-display text-[28px] leading-9 font-extrabold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-secondary-foreground mt-2 text-sm">{description}</p>
        ) : null}
      </div>
      {children}
      {footer ? <div className="text-secondary-foreground text-sm">{footer}</div> : null}
    </section>
  );
}
