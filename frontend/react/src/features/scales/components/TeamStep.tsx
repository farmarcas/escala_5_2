import type { FieldErrors, PreviewState } from '../hooks/usePreview';
import { roleWarning } from '../roleWarning';
import type { ScaleRole, ScaleStoreDraft } from '../types';
import { RoleCard } from './RoleCard';

type Props = {
  draft: ScaleStoreDraft;
  errors: FieldErrors;
  preview: PreviewState;
  onChange: (patch: Partial<ScaleStoreDraft>) => void;
};

export function TeamStep({ draft, errors, preview, onChange }: Props) {
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
          warning={preview.status === 'ready' ? roleWarning(role, preview.diagnostic.rows) : null}
          onChange={(patch) => setRole(index, patch)}
        />
      ))}
    </div>
  );
}
