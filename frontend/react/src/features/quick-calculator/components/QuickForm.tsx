import { NumberField } from '@/components/ui/NumberField';
import { SelectField } from '@/components/ui/SelectField';
import { SliderField } from '@/components/ui/SliderField';
import type {
  Maturity,
  OperatingDays,
  Premises,
  StoreProfile,
  TaxRegime,
} from '@/lib/premisesTypes';
import { DAYS_LABELS, MATURITY_LABELS, REGIME_LABELS } from '@/lib/quickLabels';
import type { QuickFormErrors, QuickFormField, QuickFormValues } from '../validateQuickInput';

type QuickFormProps = {
  values: QuickFormValues;
  errors: QuickFormErrors;
  profile: StoreProfile;
  operatingDays: OperatingDays;
  regime: TaxRegime;
  maturity: Maturity;
  profiles: Premises['quick']['profiles'];
  onFieldChange: (field: QuickFormField, value: number | null) => void;
  onProfileChange: (value: StoreProfile) => void;
  onOperatingDaysChange: (value: OperatingDays) => void;
  onRegimeChange: (value: TaxRegime) => void;
  onMaturityChange: (value: Maturity) => void;
};

const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const DAYS_OPTIONS = toOptions(DAYS_LABELS);
const REGIME_OPTIONS = toOptions(REGIME_LABELS);
const MATURITY_OPTIONS = toOptions(MATURITY_LABELS);

export function QuickForm({
  values,
  errors,
  profile,
  operatingDays,
  regime,
  maturity,
  profiles,
  onFieldChange,
  onProfileChange,
  onOperatingDaysChange,
  onRegimeChange,
  onMaturityChange,
}: QuickFormProps) {
  const profileOptions = (Object.keys(profiles) as StoreProfile[]).map((key) => ({
    value: key,
    label: profiles[key].label,
  }));

  return (
    <form
      className="bg-background border-border flex flex-col gap-4 rounded-lg border p-5"
      onSubmit={(event) => event.preventDefault()}
      aria-labelledby="perfil-titulo"
    >
      <h2 id="perfil-titulo" className="text-lg font-semibold">
        Perfil do seu grupo
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Número de lojas"
          value={values.storeCount}
          onValueChange={(value) => onFieldChange('storeCount', value)}
          error={errors.storeCount}
          hint="Usado só para mostrar o impacto médio por loja."
        />
        <NumberField
          label="Total de colaboradores"
          value={values.employees}
          onValueChange={(value) => onFieldChange('employees', value)}
          error={errors.employees}
        />
      </div>

      <SliderField
        label="Colaboradores em escala 6x1 (jornada de 44h)"
        value={values.pctSixByOne ?? 0}
        onValueChange={(value) => onFieldChange('pctSixByOne', value)}
        formatValue={(value) => `${value}%`}
        error={errors.pctSixByOne}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Salário médio mensal dos afetados"
          value={values.averageSalary}
          onValueChange={(value) => onFieldChange('averageSalary', value)}
          prefix="R$"
          error={errors.averageSalary}
        />
        <NumberField
          label="Faturamento anual do grupo"
          value={values.annualRevenue}
          onValueChange={(value) => onFieldChange('annualRevenue', value)}
          prefix="R$"
          error={errors.annualRevenue}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Perfil predominante das lojas"
          value={profile}
          options={profileOptions}
          onValueChange={onProfileChange}
        />
        <SelectField
          label="Dias de funcionamento"
          value={operatingDays}
          options={DAYS_OPTIONS}
          onValueChange={onOperatingDaysChange}
        />
        <SelectField
          label="Regime tributário"
          value={regime}
          options={REGIME_OPTIONS}
          onValueChange={onRegimeChange}
        />
        <SelectField
          label="Maturidade de adequação"
          value={maturity}
          options={MATURITY_OPTIONS}
          onValueChange={onMaturityChange}
          hint="Define até quanto as ações de mitigação conseguem reduzir o impacto."
        />
      </div>
    </form>
  );
}
