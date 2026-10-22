import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useSubmit } from '@/hooks/useSubmit';

type SaveSimulationDialogProps = {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  description?: string;
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
};

export function SaveSimulationDialog({
  isOpen,
  title,
  submitLabel,
  description,
  initialName = '',
  onClose,
  onSave,
}: SaveSimulationDialogProps) {
  const [name, setName] = useState(initialName);
  const [showError, setShowError] = useState(false);
  const { submit, isSubmitting, error, clearError } = useSubmit(onSave);

  const nameError =
    showError && name.trim().length < 2 ? 'Dê um nome com ao menos 2 letras.' : undefined;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setShowError(true);
    if (name.trim().length < 2) return;
    await submit(name.trim());
  };

  const handleClose = () => {
    clearError();
    setShowError(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title={title} onClose={handleClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        <TextField
          label="Nome da simulação"
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
        />
        {error ? <FormMessage tone="error">{error}</FormMessage> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : submitLabel}
          </Button>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
