import { useState } from 'react';
import { errorMessage } from '@/lib/api';

// Controla envio de formulário: bloqueia duplo clique e guarda a mensagem de erro da API.
export function useSubmit<T>(action: (input: T) => Promise<void>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (input: T): Promise<boolean> => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    setError(null);
    try {
      await action(input);
      return true;
    } catch (caught) {
      setError(errorMessage(caught));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error, clearError: () => setError(null) };
}
