import { buildSummaryText } from '@/lib/buildSummaryText';
import type { QuickResult } from '@/lib/quickImpact';

type ExecutiveSummaryProps = { result: QuickResult };

export function ExecutiveSummary({ result }: ExecutiveSummaryProps) {
  return (
    <section
      className="bg-primary text-primary-foreground rounded-lg p-5"
      aria-labelledby="sintese-titulo"
    >
      <h2 id="sintese-titulo" className="text-xs font-semibold tracking-wide uppercase">
        Síntese para a diretoria
      </h2>
      <p className="mt-2 text-sm leading-relaxed">{buildSummaryText(result)}</p>
    </section>
  );
}
