import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { ContactFormModal, type ContactSnapshot } from '@/features/contact';
import type { Alert } from '../types';

const SEVERITY = {
  danger: { tone: 'danger', label: 'Prioritário' },
  warning: { tone: 'warning', label: 'Atenção' },
  info: { tone: 'info', label: 'Ajuste' },
} as const;

type Props = { alerts: Alert[]; storeId: string; snapshot: ContactSnapshot };

export function AlertsBlock({ alerts, storeId, snapshot }: Props) {
  const [contactOpen, setContactOpen] = useState(false);
  return (
    <section className="border-border bg-background rounded-lg border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">Alertas e ajustes</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/v1/scales/stores/${storeId}/report.xlsx`}
            download
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex items-center rounded-md px-3 py-2 text-xs font-bold"
          >
            Baixar relatório completo (Excel)
          </a>
          <Button size="sm" variant="secondary" onClick={() => setContactOpen(true)}>
            Falar com um consultor
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        O relatório traz o comparativo de pessoas e custos, o plano de ação, o modelo de cada função
        e as escalas de 4 semanas de cada cenário. O consultor recebe um resumo desta simulação;
        nada é enviado sem você pedir.
      </p>
      {alerts.length === 0 ? (
        <p className="mt-3 text-sm">Nenhum alerta para esta loja.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="border-border flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-start sm:gap-3"
            >
              <span className="shrink-0">
                <StatusPill tone={SEVERITY[a.severity].tone}>
                  {SEVERITY[a.severity].label}
                </StatusPill>
              </span>
              <span className="text-sm">{a.message}</span>
            </li>
          ))}
        </ul>
      )}
      <ContactFormModal
        key={String(contactOpen)}
        isOpen={contactOpen}
        snapshot={snapshot}
        onClose={() => setContactOpen(false)}
      />
    </section>
  );
}
