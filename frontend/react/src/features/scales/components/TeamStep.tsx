import type { FieldErrors } from '../hooks/usePreview';
import type { ScaleRole, ScaleStoreDraft } from '../types';
import { RoleCard } from './RoleCard';

type Props = {
  draft: ScaleStoreDraft;
  errors: FieldErrors;
  onChange: (patch: Partial<ScaleStoreDraft>) => void;
};

export function TeamStep({ draft, errors, onChange }: Props) {
  const setRole = (index: number, patch: Partial<ScaleRole>) =>
    onChange({ roles: draft.roles.map((r, i) => (i === index ? { ...r, ...patch } : r)) });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Informe quantas pessoas você tem hoje em cada função. Gerente e subgerente aparecem juntos
        no quadro, mas cada um tem quantidade e salário próprios.
      </p>
      {draft.roles.map((role, index) => (
        <RoleCard
          key={role.role}
          role={role}
          error={errors[`roles.${index}`] ?? errors[`roles.${index}.headcount`]}
          onChange={(patch) => setRole(index, patch)}
        />
      ))}
    </div>
  );
}
