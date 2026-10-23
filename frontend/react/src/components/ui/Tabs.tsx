import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

export type TabItem = { to: string; label: string };

// Abas de navegação (cada uma é uma rota). Rolam na horizontal em telas estreitas.
export function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  return (
    <nav aria-label={label} className="border-border overflow-x-auto border-b">
      <ul className="flex min-w-max gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  '-mb-px inline-block border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap',
                  isActive
                    ? 'border-primary text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground border-transparent',
                )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
