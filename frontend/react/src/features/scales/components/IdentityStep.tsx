import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import type { FieldErrors } from '../hooks/usePreview';
import type { ScaleStoreDraft } from '../types';

type Props = {
  draft: ScaleStoreDraft;
  errors: FieldErrors;
  onChange: (patch: Partial<ScaleStoreDraft>) => void;
};

const UFS =
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

export function IdentityStep({ draft, errors, onChange }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="Nome da loja"
        value={draft.name}
        error={errors['name']}
        onChange={(e) => onChange({ name: e.target.value })}
        className="sm:col-span-2"
      />
      <TextField
        label="Cidade"
        value={draft.city}
        error={errors['city']}
        onChange={(e) => onChange({ city: e.target.value })}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="uf" className="text-sm font-medium">
          UF
        </label>
        <select
          id="uf"
          value={draft.state}
          onChange={(e) => onChange({ state: e.target.value })}
          className="border-input bg-surface w-full rounded-lg border p-3 text-sm"
        >
          {UFS.map((uf) => (
            <option key={uf}>{uf}</option>
          ))}
        </select>
        {errors['state'] ? (
          <p role="alert" className="text-critical text-xs">
            {errors['state']}
          </p>
        ) : null}
      </div>
      <TextField
        label="Início da escala (segunda-feira)"
        type="date"
        value={draft.scaleStartDate}
        error={errors['scaleStartDate']}
        hint="A escala de 4 semanas começa nesta segunda-feira."
        onChange={(e) => onChange({ scaleStartDate: e.target.value })}
      />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Regime tributário</span>
        <SegmentedControl
          label="Regime tributário"
          value={draft.taxRegime}
          options={[
            { value: 'simples', label: 'Simples Nacional' },
            { value: 'lucro_presumido_real', label: 'Presumido / Real' },
          ]}
          onValueChange={(taxRegime) => onChange({ taxRegime })}
        />
        <p className="text-muted-foreground text-xs">
          No Simples o INSS patronal vai dentro do imposto único (DAS).
        </p>
      </div>
    </div>
  );
}
