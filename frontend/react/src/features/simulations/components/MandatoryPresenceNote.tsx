type MandatoryPresenceNoteProps = { hasDeficit: boolean };

export function MandatoryPresenceNote({ hasDeficit }: MandatoryPresenceNoteProps) {
  return (
    <p className="text-warning bg-warning-background rounded-md p-2 text-xs">
      {hasDeficit
        ? 'Presença obrigatória: a loja não pode abrir sem farmacêutico, então esta falta de horas não pode ser coberta por outra função. É preciso contratar.'
        : 'Presença obrigatória enquanto a loja está aberta; nenhuma outra função substitui o farmacêutico.'}
    </p>
  );
}
