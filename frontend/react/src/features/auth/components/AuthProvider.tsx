import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import {
  AuthContext,
  type AuthContextValue,
  type AuthState,
  type GroupPatch,
} from '../authContext';
import type { GroupInfo, SessionPayload } from '../types';

type AuthProviderProps = { children: ReactNode };

const toState = (payload: SessionPayload): AuthState => ({
  status: 'authenticated',
  user: payload.user,
  group: payload.group,
});

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<SessionPayload>('/auth/me')
      .then((payload) => {
        if (!controller.signal.aborted) setState(toState(payload));
      })
      .catch(() => {
        // 401 é o caso normal de quem ainda não entrou; falha de rede também cai em "anônimo".
        if (!controller.signal.aborted) setState({ status: 'anonymous' });
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await apiFetch<SessionPayload>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setState(toState(payload));
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setState({ status: 'anonymous' });
  }, []);

  const updateGroup = useCallback(async (patch: GroupPatch) => {
    const response = await apiFetch<{ group: GroupInfo }>('/groups/current', {
      method: 'PATCH',
      body: patch,
    });
    setState((current) =>
      current.status === 'authenticated' ? { ...current, group: response.group } : current,
    );
  }, []);

  // Exclusão a pedido do titular (LGPD): a API apaga o grupo inteiro e encerra a sessão.
  const deleteAccount = useCallback(async (password: string) => {
    await apiFetch('/auth/account', { method: 'DELETE', body: { password } });
    setState({ status: 'anonymous' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, logout, updateGroup, deleteAccount }),
    [state, login, logout, updateGroup, deleteAccount],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
