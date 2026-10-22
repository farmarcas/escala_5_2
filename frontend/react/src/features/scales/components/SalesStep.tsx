import { Checkbox } from '@/components/ui/Checkbox';
import { NumberField } from '@/components/ui/NumberField';
import type { FieldErrors } from '../hooks/usePreview';
import type { ScaleStoreDraft } from '../types';

type Props = {
  draft: ScaleStoreDraft;
  errors: FieldErrors;
  onChange: (patch: Partial<ScaleStoreDraft>) => void;
};

export function SalesStep({ draft, errors, onChange }: Props) {
  const { sales } = draft;
  const set = (patch: Partial<ScaleStoreDraft['sales']>) =>
    onChange({ sales: { ...sales, ...patch } });

  return (
    <div className="flex flex-col gap-5">
      <Checkbox
        label="Analisar vendas, CMV e meta da folha"
        description="Opcional. Mostra quanto a loja precisa vender para pagar a mercadoria e a folha nova."
        checked={sales.enabled}
        onChange={(e) => set({ enabled: e.target.checked })}
      />
      {sales.enabled ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Vendas por mês"
            prefix="R$"
            value={sales.monthlySales}
            error={errors['sales.monthlySales']}
            onValueChange={(v) => set({ monthlySales: Math.max(0, v ?? 0) })}
          />
          <NumberField
            label="CMV (custo da mercadoria)"
            suffix="%"
            value={Math.round(sales.cmvRate * 10000) / 100}
            hint="Percentual das vendas"
            onValueChange={(v) => set({ cmvRate: Math.min(100, Math.max(0, v ?? 0)) / 100 })}
          />
          <NumberField
            label="Meta da folha"
            suffix="%"
            value={Math.round(sales.payrollTargetRate * 10000) / 100}
            hint="Folha como % das vendas"
            onValueChange={(v) =>
              set({ payrollTargetRate: Math.min(100, Math.max(0, v ?? 0)) / 100 })
            }
          />
        </div>
      ) : null}
    </div>
  );
}
