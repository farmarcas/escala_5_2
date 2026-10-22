export type SessionUser = { id: string; name: string; email: string };

export type GroupInfo = {
  id: string;
  name: string;
  taxRegime: 'real' | 'presumido' | 'simples';
  annualRevenue: number | null;
};

export type SessionPayload = { user: SessionUser; group: GroupInfo };
