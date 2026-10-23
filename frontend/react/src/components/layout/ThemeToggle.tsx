import { Monitor, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { applyTheme, nextTheme, readTheme, type ThemeChoice } from '@/lib/theme';

const LABEL: Record<ThemeChoice, string> = {
  auto: 'automático (segue o aparelho)',
  claro: 'claro',
  escuro: 'escuro',
};
const ICON = { auto: Monitor, claro: Sun, escuro: Moon } as const;

// Troca o tema a cada clique: automático, claro e escuro.
export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(readTheme);
  const next = nextTheme(choice);
  return (
    <Button
      variant="ghost"
      size="md"
      aria-label={`Tema ${LABEL[choice]}. Trocar para ${LABEL[next]}.`}
      title={`Tema ${LABEL[choice]}`}
      onClick={() => {
        applyTheme(next);
        setChoice(next);
      }}
    >
      <Icon icon={ICON[choice]} size={20} />
    </Button>
  );
}
