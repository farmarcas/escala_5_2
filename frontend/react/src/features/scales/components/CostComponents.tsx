import { formatBRL } from '@/lib/formatPtBr';
import type { Components, PayrollSummary } from '../types';

type Props = { today: PayrollSummary; next: PayrollSummary; nextLabel: string; regime: string };

type Line = { key: keyof Components; label: string };

const DIRECT: Line[] = [
  { key: 'salary', label: 'Salários de registro' },
  { key: 'hazard', label: 'Periculosidade (entregador de moto)' },
  { key: 'holidayDouble', label: 'Feriados trabalhados pagos em dobro' },
  { key: 'night', label: 'Adicional noturno' },
  { key: 'overtime', label: 'Horas extras (plantão)' },
  { key: 'dsr', label: 'Reflexo no DSR' },
  { key: 'indemnifiedBreak', label: 'Intervalo indenizado' },
];

const INDIRECT: Line[] = [
  { key: 'thirteenth', label: '13º salário (provisão)' },
  { key: 'vacation', label: 'Férias + 1/3 (provisão)' },
  { key: 'fgts', label: 'FGTS' },
  { key: 'fgtsFine', label: 'Multa FGTS (provisão)' },
  { key: 'inss', label: 'INSS patronal + RAT + terceiros' },
  { key: 'transport', label: 'Vale-transporte (parte da empresa)' },
  { key: 'otherBenefits', label: 'Outros benefícios' },
];

export function CostComponents({ today, next, nextLabel, regime }: Props) {
  const row = (line: Line) => (
    <tr key={line.key}>
      <th scope="row" className="py-2 pr-3 font-normal">
        {line.label}
        {line.key === 'inss' && regime === 'simples' ? (
          <span className="text-muted-foreground block text-xs">Dentro do DAS no Simples</span>
        ) : null}
      </th>
      <td className="px-3 py-2 text-right tabular-nums">{formatBRL(today.components[line.key])}</td>
      <td className="py-2 pl-3 text-right tabular-nums">{formatBRL(next.components[line.key])}</td>
    </tr>
  );
  const subtotal = (label: string, a: number, b: number) => (
    <tr className="bg-muted font-bold">
      <th scope="row" className="py-2 pr-3 pl-2 text-left">
        {label}
      </th>
      <td className="px-3 py-2 text-right tabular-nums">{formatBRL(a)}</td>
      <td className="py-2 pr-2 pl-3 text-right tabular-nums">{formatBRL(b)}</td>
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] text-left text-sm">
        <thead className="text-muted-foreground text-xs uppercase">
          <tr>
            <th className="py-2 pr-3">Componente mensal</th>
            <th className="px-3 py-2 text-right">Hoje</th>
            <th className="py-2 pl-3 text-right">{nextLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {DIRECT.map(row)}
          {subtotal('Custo direto', today.direct, next.direct)}
          {INDIRECT.map(row)}
          {subtotal('Custo indireto', today.indirect, next.indirect)}
          <tr className="font-bold">
            <th scope="row" className="py-3 pr-3 text-left">
              Folha mensal total
            </th>
            <td className="px-3 py-3 text-right tabular-nums">{formatBRL(today.total)}</td>
            <td className="py-3 pl-3 text-right tabular-nums">{formatBRL(next.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
