import { describe, expect, it } from 'vitest';
import { isThemeChoice, nextTheme } from './theme';

describe('tema', () => {
  it('alterna automático, claro e escuro, e volta ao automático', () => {
    expect(nextTheme('auto')).toBe('claro');
    expect(nextTheme('claro')).toBe('escuro');
    expect(nextTheme('escuro')).toBe('auto');
  });

  it('só aceita as três escolhas', () => {
    expect(isThemeChoice('claro')).toBe(true);
    expect(isThemeChoice('azul')).toBe(false);
    expect(isThemeChoice(null)).toBe(false);
  });
});
