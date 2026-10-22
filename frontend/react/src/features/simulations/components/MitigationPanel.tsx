import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { NumberField } from '@/components/ui/NumberField';
import type { Premises } from '@/lib/premisesTypes';
import { toggleAction, type StoreMitigationState } from '../mitigationsState';

type MitigationPanelProps = {
  storeName: string;
  actions: Premises['detailed']['actions'];
  state: StoreMitigationState;
  canApplyToAll: boolean;
  onChange: (state: StoreMitigationState) => void;
  onApplyToAll: () => void;
};

export function MitigationPanel({
  storeName,
  actions,
  state,
  canApplyToAll,
  onChange,
  onApplyToAll,
}: MitigationPanelProps) {
  return (
    <fieldset className="border-border mt-3 flex flex-col gap-3 rounded-md border p-3">
      <legend className="px-1 text-sm font-semibold">
        Ações para reduzir o impacto: {storeName}
      </legend>
      <p className="text-muted-foreground text-xs">
        Cada ação reduz a falta de horas da loja pelo efeito que você estimar (a sugestão é da
        Farmarcas). Multifuncionalidade, automação, banco de horas e as demais não valem para o
        farmacêutico, que é presença obrigatória: para ele só contam a negociação coletiva e o
        ajuste de horário.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => {
          const current = state.actions[action.id];
          return (
            <div key={action.id} className="flex flex-col gap-2">
              <Checkbox
                label={action.title}
                description={action.description}
                checked={current?.isOn ?? false}
                onChange={(event) =>
                  onChange(toggleAction(state, action.id, event.target.checked, actions))
                }
              />
              {current?.isOn ? (
                <NumberField
                  label={`${action.title}: efeito estimado`}
                  value={current.effectPct}
                  suffix="%"
                  hint="Quanto da falta de horas essa ação resolve."
                  onValueChange={(value) =>
                    onChange({
                      ...state,
                      actions: { ...state.actions, [action.id]: { isOn: true, effectPct: value } },
                    })
                  }
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <NumberField
        label="Ajuste de horário: horas a menos por semana"
        value={state.hoursReduction}
        suffix="h"
        hint="Por exemplo, fechar mais cedo ou reduzir o domingo. Vale para todas as funções."
        onValueChange={(value) => onChange({ ...state, hoursReduction: value })}
      />

      {canApplyToAll ? (
        <div>
          <Button variant="secondary" size="sm" onClick={onApplyToAll}>
            Aplicar estas ações a todas as lojas
          </Button>
        </div>
      ) : null}
    </fieldset>
  );
}
