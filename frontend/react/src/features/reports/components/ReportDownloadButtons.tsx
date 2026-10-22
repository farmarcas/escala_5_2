import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/features/auth/components/FormMessage';

type ReportDownloadButtonsProps = {
  onDownloadPdf: () => Promise<void>;
  onDownloadCsv?: () => void;
};

export function ReportDownloadButtons({
  onDownloadPdf,
  onDownloadCsv,
}: ReportDownloadButtonsProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handlePdf = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setHasError(false);
    try {
      await onDownloadPdf();
    } catch {
      setHasError(true);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => void handlePdf()} disabled={isBusy}>
          {isBusy ? 'Gerando PDF…' : 'Baixar relatório em PDF'}
        </Button>
        {onDownloadCsv ? (
          <Button variant="secondary" onClick={onDownloadCsv}>
            Baixar planilha (CSV)
          </Button>
        ) : null}
      </div>
      {hasError ? (
        <FormMessage tone="error">Não foi possível gerar o PDF agora. Tente de novo.</FormMessage>
      ) : null}
    </div>
  );
}
