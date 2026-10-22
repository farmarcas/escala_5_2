import { Button } from '@/components/ui/Button';
import { NumberField } from '@/components/ui/NumberField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Maturity, Premises, StoreProfile } from '@/lib/premisesTypes';

type PremisesPanelProps = {
  premises: Premises;
  profile: StoreProfile;
  maturity: Maturity;
  isChanged: boolean;
  onChange: (premises: Premises) => void;
  onReset: () => void;
};

const toPercent = (fraction: number) => Math.round(fraction * 1e6) / 1e4;
const fromPercent = (percent: number) => percent / 100;

export function PremisesPanel({
  premises,
  profile,
  maturity,
  isChanged,
  onChange,
  onReset,
}: PremisesPanelProps) {
  const profileData = premises.quick.profiles[profile];

  const update = (recipe: (draft: Premises) => void) => {
    const draft = structuredClone(premises);
    recipe(draft);
    onChange(draft);
  };

  return (
    <details className="bg-background border-border rounded-lg border p-5">
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-lg font-semibold">
        Premissas do cálculo
        {isChanged ? <StatusBadge tone="warning">Premissas alteradas</StatusBadge> : null}
      </summary>

      <p className="text-muted-foreground mt-3 text-sm">
        São os números por trás da estimativa. Você pode ajustá-los à realidade do seu grupo; o
        resultado muda na hora.
        {premises.provisional
          ? ' Os valores padrão são provisórios e ainda estão em validação pela Farmarcas.'
          : ''}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Encargos (Lucro Real e Presumido)"
          value={premises.taxation.chargesRealPresumido}
          hint="Multiplicador sobre o salário. 1,55 = 55% de encargos."
          onValueChange={(value) =>
            value !== null && update((d) => void (d.taxation.chargesRealPresumido = value))
          }
        />
        <NumberField
          label="Encargos (Simples Nacional)"
          value={premises.taxation.chargesSimples}
          onValueChange={(value) =>
            value !== null && update((d) => void (d.taxation.chargesSimples = value))
          }
        />
        <NumberField
          label="Meses de remuneração por ano"
          value={premises.taxation.monthsPerYear}
          hint="12 meses mais 13º e adicional de férias."
          onValueChange={(value) =>
            value !== null && update((d) => void (d.taxation.monthsPerYear = value))
          }
        />
        <NumberField
          label="Alíquota IRPJ + CSLL (Lucro Real)"
          value={toPercent(premises.taxation.irpjCsllRate)}
          suffix="%"
          hint="Considera empresa com lucro suficiente para abater o custo."
          onValueChange={(value) =>
            value !== null && update((d) => void (d.taxation.irpjCsllRate = fromPercent(value)))
          }
        />
        <NumberField
          label={`Margem operacional (${profileData.label})`}
          value={toPercent(profileData.operatingMargin)}
          suffix="%"
          onValueChange={(value) =>
            value !== null &&
            update((d) => void (d.quick.profiles[profile].operatingMargin = fromPercent(value)))
          }
        />
        <NumberField
          label={`Cobertura mínima (${profileData.label})`}
          value={toPercent(profileData.coverageMin)}
          suffix="%"
          hint="Quanto da lacuna de horas vira contratação no cenário mais leve."
          onValueChange={(value) =>
            value !== null &&
            update((d) => void (d.quick.profiles[profile].coverageMin = fromPercent(value)))
          }
        />
        <NumberField
          label={`Cobertura máxima (${profileData.label})`}
          value={toPercent(profileData.coverageMax)}
          suffix="%"
          hint="Quanto da lacuna de horas vira contratação no cenário mais pesado."
          onValueChange={(value) =>
            value !== null &&
            update((d) => void (d.quick.profiles[profile].coverageMax = fromPercent(value)))
          }
        />
        <NumberField
          label="Redução mínima com ações"
          value={toPercent(premises.quick.mitigation.floor)}
          suffix="%"
          hint="Vale quando há ao menos uma ação marcada."
          onValueChange={(value) =>
            value !== null && update((d) => void (d.quick.mitigation.floor = fromPercent(value)))
          }
        />
        <NumberField
          label="Redução máxima com ações (maturidade escolhida)"
          value={toPercent(premises.quick.mitigation.capByMaturity[maturity])}
          suffix="%"
          onValueChange={(value) =>
            value !== null &&
            update((d) => void (d.quick.mitigation.capByMaturity[maturity] = fromPercent(value)))
          }
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={onReset} disabled={!isChanged}>
          Voltar ao padrão
        </Button>
        <span className="text-muted-foreground text-xs">
          Versão {premises.version} · revisada em {premises.reviewedAt}
        </span>
      </div>
    </details>
  );
}
