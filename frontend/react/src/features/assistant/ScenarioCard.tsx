import { Link } from 'react-router-dom';
import { ComparisonKpi } from '@/components/ui/KpiCard';
import { formatBRL, formatDelta, formatInt, formatSignedBRL } from '@/lib/formatPtBr';
import { STEP_LABEL, stepLink } from './steps';
import type { ScenarioResult } from './types';

type Props = { scenario: ScenarioResult; storeId: string; onNavigate: () => void };

// Cenário simulado pela IA: só leitura. Nada aqui altera a loja; "Onde mudar" abre o passo do cadastro.
export function ScenarioCard({ scenario: s, storeId, onNavigate }: Props) {
  const steps = [...new Set(s.mudancas.map((m) => m.passo))];
  return (
    <section
      aria-label={`Cenário: ${s.titulo}`}
      className="border-border bg-muted flex flex-col gap-3 rounded-lg border p-4"
    >
      <div>
        <p className="text-secondary-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          Cenário simulado
        </p>
        <h4 className="font-display text-base font-semibold">{s.titulo}</h4>
      </div>
      <ul className="flex list-disc flex-col gap-0.5 pl-5 text-sm">
        {s.mudancas.map((m, i) => (
          <li key={i}>{m.descricao}</li>
        ))}
      </ul>
      <div className="grid gap-3">
        <ComparisonKpi
          label="Pessoas na equipe"
          now={formatInt(s.antes.colaboradores)}
          next={formatInt(s.depois.colaboradores)}
          delta={formatDelta(
            s.diferenca.colaboradores,
            s.diferenca.colaboradores === 1 || s.diferenca.colaboradores === -1
              ? 'pessoa'
              : 'pessoas',
          )}
          nextLabel="Cenário"
        />
        <ComparisonKpi
          label="Folha por mês"
          now={formatBRL(s.antes.folhaMensal)}
          next={formatBRL(s.depois.folhaMensal)}
          delta={`${formatSignedBRL(s.diferenca.folhaMensal)} por mês · ${formatDelta(s.diferenca.percentual, '%', 1)}`}
          detail={`${formatSignedBRL(s.diferenca.folhaAnual)} por ano`}
          nextLabel="Cenário"
        />
      </div>
      {steps.length > 0 ? (
        <p className="text-xs">
          <span className="text-secondary-foreground">Onde mudar: </span>
          {steps.map((step, i) => (
            <span key={step}>
              {i > 0 ? ' · ' : ''}
              <Link
                to={stepLink(storeId, step)}
                onClick={onNavigate}
                className="text-primary-strong underline"
              >
                {STEP_LABEL[step]}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
      <p className="text-muted-foreground text-xs">
        Simulação: a loja cadastrada continua como está até você mudar.
      </p>
    </section>
  );
}
