import { createContext } from 'react';
import type { GroupInfo, SessionUser } from './types';

export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: SessionUser; group: GroupInfo };

export type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateGroup: (patch: GroupPatch) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
};

export type GroupPatch = {
  name?: string;
  taxRegime?: GroupInfo['taxRegime'];
  annualRevenue?: number | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
