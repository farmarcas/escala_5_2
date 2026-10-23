import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { apiFetch, errorMessage } from '@/lib/api';
import type { LegalRule } from '../types';

type Payload = { asOf: string; rules: LegalRule[] };

const formatDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function RulesTab() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    apiFetch<Payload>('/scales/rules')
      .then((r) => isCurrent && setData(r))
      .catch((e: unknown) => isCurrent && setError(errorMessage(e)));
    return () => {
      isCurrent = false;
    };
  }, []);

  if (error) return <FormMessage tone="error">{error}</FormMessage>;
  if (!data) return <Skeleton className="h-64" />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">Regras aplicadas pelo painel</h2>
        <p className="text-muted-foreground text-sm">
          Base legal usada para montar as escalas e calcular custos, conforme a legislação vigente
          em {formatDate(data.asOf)}, data da promulgação da EC 141/2026. Se uma nova lei,
          regulamentação ou convenção coletiva mudar essas regras, os resultados do painel também
          mudam.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {data.rules.map((r) => (
          <li
            key={r.id}
            className="border-border bg-surface flex flex-col gap-2 rounded-lg border p-4"
          >
            <h3 className="font-display text-lg font-semibold">{r.title}</h3>
            <p className="text-sm">{r.text}</p>
            <p className="text-muted-foreground mt-auto text-xs">
              {r.source} · em vigor desde {formatDate(r.effectiveFrom)}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">
        Uma lei complementar ainda pode criar medidas de transição para MEI, microempresas e
        empresas de pequeno porte. Convenções coletivas firmadas antes da emenda precisarão ser
        revistas.
      </p>
      <p className="text-muted-foreground text-xs">
        Ferramenta de planejamento e apoio à decisão. Não substitui a orientação do seu contador ou
        advogado. Os cálculos seguem a legislação vigente na data acima e podem mudar se uma nova
        lei, regulamentação, decisão judicial ou convenção coletiva alterar as regras.
      </p>
    </div>
  );
}
