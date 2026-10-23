// Tema da interface: "auto" segue o aparelho; "claro" e "escuro" fixam. A escolha fica só neste navegador.
export type ThemeChoice = 'auto' | 'claro' | 'escuro';

export const THEME_KEY = 'radar-escala-tema';
const ORDER: ThemeChoice[] = ['auto', 'claro', 'escuro'];

export const nextTheme = (current: ThemeChoice): ThemeChoice =>
  ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!;

export const isThemeChoice = (value: unknown): value is ThemeChoice =>
  value === 'auto' || value === 'claro' || value === 'escuro';

export function readTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isThemeChoice(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice === 'claro' ? 'light' : 'dark');
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Sem armazenamento (janela privada): o tema vale só até recarregar.
  }
}
