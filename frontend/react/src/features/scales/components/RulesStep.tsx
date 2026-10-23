import { Checkbox } from '@/components/ui/Checkbox';
import { NumberField } from '@/components/ui/NumberField';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import type { FieldErrors } from '../hooks/usePreview';
import type { ScaleStoreDraft } from '../types';

type Props = {
  draft: ScaleStoreDraft;
  errors: FieldErrors;
  onChange: (patch: Partial<ScaleStoreDraft>) => void;
};

export function RulesStep({ draft, errors, onChange }: Props) {
  const { rules } = draft;
  const set = (patch: Partial<ScaleStoreDraft['rules']>) =>
    onChange({ rules: { ...rules, ...patch } });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label="Folga dominical"
        value={rules.sundayRule}
        error={errors['rules.sundayRule']}
        options={[
          { value: 'um_em_tres', label: '1 domingo de folga a cada 3 semanas (lei)' },
          { value: 'um_em_dois', label: '1 domingo de folga a cada 2 semanas' },
          { value: 'todo_domingo', label: 'Todo domingo (convenção coletiva)' },
        ]}
        onValueChange={(sundayRule) => set({ sundayRule })}
        hint="A lei exige ao menos 1 domingo de folga a cada 3 semanas no comércio."
      />
      <SelectField
        label="Almoço"
        value={String(rules.lunchMinutes)}
        options={[
          { value: '60', label: '60 minutos' },
          { value: '90', label: '90 minutos' },
          { value: '120', label: '120 minutos' },
          { value: '30', label: '30 minutos (só com convenção coletiva)' },
        ]}
        onValueChange={(v) => set({ lunchMinutes: Number(v) })}
      />
      <SelectField
        label="Lanche pago"
        value={String(rules.snackMinutes)}
        options={[
          { value: '0', label: 'Sem lanche' },
          { value: '10', label: '10 minutos' },
          { value: '15', label: '15 minutos' },
          { value: '20', label: '20 minutos' },
        ]}
        onValueChange={(v) => set({ snackMinutes: Number(v) })}
        hint="O lanche conta como tempo trabalhado."
      />
      <div className="sm:col-span-2">
        <Checkbox
          label="Incluir provisões (13º, férias + 1/3 e multa do FGTS)"
          checked={rules.provisions}
          onChange={(e) => set({ provisions: e.target.checked })}
        />
      </div>
      <TextField
        label="Convenção coletiva (CCT) aplicável"
        value={rules.cct}
        placeholder="Sindicato e vigência, por exemplo: Sindicato do Comércio de Varginha, 2026"
        hint="Texto livre. O painel não aplica regras específicas da convenção, só avisa que conferir é importante."
        onChange={(e) => set({ cct: e.target.value })}
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <Checkbox
          label="Indenizar o intervalo na 12x36"
          description="Na 12x36 o intervalo não gozado é pago com 50% de acréscimo."
          checked={rules.indemnifyBreak}
          onChange={(e) => set({ indemnifyBreak: e.target.checked })}
        />
      </div>
      <NumberField
        label="Passagens por dia (vale-transporte)"
        value={rules.transport.tripsPerDay}
        onValueChange={(v) =>
          set({
            transport: {
              ...rules.transport,
              tripsPerDay: Math.min(4, Math.max(0, Math.round(v ?? 0))),
            },
          })
        }
      />
      <NumberField
        label="Valor da passagem"
        prefix="R$"
        value={rules.transport.fare}
        onValueChange={(v) => set({ transport: { ...rules.transport, fare: Math.max(0, v ?? 0) } })}
        hint="A empresa paga o que passar de 6% do salário."
      />
      <NumberField
        label="Outros benefícios por colaborador (por mês)"
        prefix="R$"
        value={rules.benefits}
        onValueChange={(v) => set({ benefits: Math.max(0, v ?? 0) })}
        hint="Vale-alimentação, plano de saúde etc."
        className="sm:col-span-2"
      />
      {draft.taxRegime === 'lucro_presumido_real' ? (
        <>
          <NumberField
            label="RAT / FAP"
            suffix="%"
            value={Math.round(rules.rat * 10000) / 100}
            onValueChange={(v) => set({ rat: Math.min(6, Math.max(0, v ?? 0)) / 100 })}
          />
          <NumberField
            label="Terceiros (Sistema S)"
            suffix="%"
            value={Math.round(rules.thirdParty * 10000) / 100}
            onValueChange={(v) => set({ thirdParty: Math.min(10, Math.max(0, v ?? 0)) / 100 })}
          />
        </>
      ) : null}
    </div>
  );
}
