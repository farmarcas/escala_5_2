import { Checkbox } from '@/components/ui/Checkbox';
import { NumberField } from '@/components/ui/NumberField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import type { FieldErrors } from '../hooks/usePreview';
import type { PlantaoRole, ScaleStoreDraft } from '../types';

type Props = {
  draft: ScaleStoreDraft;
  errors: FieldErrors;
  onChange: (patch: Partial<ScaleStoreDraft>) => void;
};

const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const PEOPLE: { role: PlantaoRole; label: string }[] = [
  { role: 'farmaceutico', label: 'Farmacêuticos no plantão' },
  { role: 'balconista', label: 'Balconistas no plantão' },
  { role: 'caixa', label: 'Caixas no plantão' },
];

export function PlantaoStep({ draft, errors, onChange }: Props) {
  const { plantao } = draft;
  const set = (patch: Partial<ScaleStoreDraft['plantao']>) =>
    onChange({ plantao: { ...plantao, ...patch } });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Plantão noturno</span>
        <SegmentedControl
          label="Tipo de plantão"
          value={plantao.type}
          options={[
            { value: 'none', label: 'Nenhum' },
            { value: 'weekly', label: 'Semanal (1 noite)' },
            { value: 'monthly', label: 'Mensal (1 semana)' },
          ]}
          onValueChange={(type) => set({ type })}
        />
        <p className="text-muted-foreground text-xs">
          Semanal: uma noite por semana. Mensal: uma semana por mês, no rodízio da cidade.
        </p>
      </div>

      {plantao.type === 'none' ? null : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plantao.type === 'weekly' ? (
            <SelectField
              label="Noite da semana"
              value={String(plantao.weekday)}
              options={WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))}
              onValueChange={(v) => set({ weekday: Number(v) })}
            />
          ) : (
            <SelectField
              label="Semana do ciclo"
              value={String(plantao.cycleWeek)}
              options={[1, 2, 3, 4].map((w) => ({ value: String(w), label: `${w}ª semana` }))}
              onValueChange={(v) => set({ cycleWeek: Number(v) })}
            />
          )}
          <div className="hidden sm:block" />
          <TextField
            label="Início do plantão"
            type="time"
            value={plantao.start}
            onChange={(e) => set({ start: e.target.value })}
          />
          <TextField
            label="Fim do plantão"
            type="time"
            value={plantao.end}
            error={errors['plantao.end']}
            onChange={(e) => set({ end: e.target.value })}
          />
          {PEOPLE.map(({ role, label }) => (
            <NumberField
              key={role}
              label={label}
              value={plantao.people[role]}
              error={role === 'farmaceutico' ? errors['plantao.people.farmaceutico'] : undefined}
              onValueChange={(v) =>
                set({
                  people: {
                    ...plantao.people,
                    [role]: Math.min(5, Math.max(0, Math.round(v ?? 0))),
                  },
                })
              }
            />
          ))}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Como cobrir</span>
            <SegmentedControl
              label="Como cobrir o plantão"
              value={plantao.cover}
              options={[
                { value: 'team', label: 'Equipe da escala (folga no dia seguinte)' },
                { value: 'intermittent', label: 'Plantonista intermitente' },
              ]}
              onValueChange={(cover) => set({ cover })}
            />
            <p className="text-muted-foreground text-xs">
              O intermitente recebe só as horas convocadas e não aumenta a equipe fixa.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Checkbox
              label="Indenizar o intervalo (hora paga com 50% de acréscimo)"
              description="Sem indenizar, 1 hora de intervalo é descontada do turno."
              checked={plantao.indemnifyBreak}
              onChange={(e) => set({ indemnifyBreak: e.target.checked })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
