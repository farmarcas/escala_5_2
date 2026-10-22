import { Button } from '@/components/ui/Button';
import { NumberField } from '@/components/ui/NumberField';
import { SelectField } from '@/components/ui/SelectField';
import type { SimulationSettings } from '../premiseOverrides';
import type { RegimeKind } from '../types';

type SimulationSettingsPanelProps = {
  regime: RegimeKind;
  settings: SimulationSettings;
  isChanged: boolean;
  onRegimeChange: (regime: RegimeKind) => void;
  onSettingsChange: (settings: SimulationSettings) => void;
  onReset: () => void;
};

const REGIME_OPTIONS: { value: RegimeKind; label: string }[] = [
  { value: 'real', label: 'Lucro Real' },
  { value: 'presumido', label: 'Lucro Presumido' },
  { value: 'simples', label: 'Simples Nacional' },
];

export function SimulationSettingsPanel({
  regime,
  settings,
  isChanged,
  onRegimeChange,
  onSettingsChange,
  onReset,
}: SimulationSettingsPanelProps) {
  const set = <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) =>
    onSettingsChange({ ...settings, [key]: value });

  return (
    <details className="bg-background border-border rounded-lg border p-5">
      <summary className="cursor-pointer text-lg font-semibold">Regime e premissas</summary>
      <p className="text-muted-foreground mt-3 text-sm">
        Os ajustes valem só para esta simulação. Os valores padrão são provisórios e ainda estão em
        validação pela Farmarcas.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Regime tributário"
          value={regime}
          options={REGIME_OPTIONS}
          onValueChange={onRegimeChange}
        />
        <NumberField
          label="Ausência padrão (férias, faltas)"
          value={settings.absenceRatePct}
          suffix="%"
          hint="Vale para funções sem ausência própria."
          onValueChange={(value) => set('absenceRatePct', value)}
        />
        <NumberField
          label="Encargos (Lucro Real e Presumido)"
          value={settings.chargesRealPresumido}
          hint="1,55 = 55% sobre o salário."
          onValueChange={(value) => set('chargesRealPresumido', value)}
        />
        <NumberField
          label="Encargos (Simples Nacional)"
          value={settings.chargesSimples}
          onValueChange={(value) => set('chargesSimples', value)}
        />
        <NumberField
          label="Meses de remuneração por ano"
          value={settings.monthsPerYear}
          hint="12 meses mais 13º e adicional de férias."
          onValueChange={(value) => set('monthsPerYear', value)}
        />
        <NumberField
          label="Alíquota IRPJ + CSLL (Lucro Real)"
          value={settings.irpjCsllRatePct}
          suffix="%"
          onValueChange={(value) => set('irpjCsllRatePct', value)}
        />
      </div>

      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={onReset} disabled={!isChanged}>
          Voltar ao padrão
        </Button>
      </div>
    </details>
  );
}
