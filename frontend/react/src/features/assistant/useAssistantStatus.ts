import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

// O botão só aparece se a API disser que a IA está ligada (chave configurada).
export function useAssistantEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    apiFetch<{ enabled: boolean }>('/assistant/status')
      .then((data) => active && setEnabled(data.enabled))
      .catch(() => active && setEnabled(false));
    return () => {
      active = false;
    };
  }, []);
  return enabled;
}
