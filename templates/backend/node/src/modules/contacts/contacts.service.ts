import { NotFoundError } from '../../shared/errors/not-found-error.js';
import type { ContactCsvRow } from './contacts.csv.js';

export type ContactRecord = ContactCsvRow & {
  privacyAcceptedAt: Date;
  profile: unknown;
  result: unknown;
};

export type NewContact = {
  source: 'consultor';
  mode: 'detalhado';
  name: string;
  roleTitle: string;
  company: string;
  phone: string;
  email: string;
  sector?: string;
  profile: Record<string, unknown>;
  result: Record<string, unknown>;
  idempotencyKey: string;
  utm?: string;
};

export type ContactsRepository = {
  findByKey: (key: string) => Promise<{ id: string } | null>;
  create: (input: NewContact & { privacyAcceptedAt: Date }) => Promise<{ id: string } | null>;
  list: (page: number, pageSize: number) => Promise<{ data: ContactRecord[]; total: number }>;
  anonymize: (id: string, at: Date) => Promise<boolean>;
};

export const makeContactsService = (
  repo: ContactsRepository,
  now: () => Date = () => new Date(),
) => ({
  // Envio repetido (duplo clique) devolve o mesmo id e não grava de novo.
  async submit(input: NewContact): Promise<{ id: string }> {
    const existing = await repo.findByKey(input.idempotencyKey);
    if (existing) return existing;

    const created = await repo.create({ ...input, privacyAcceptedAt: now() });
    if (created) return created;

    // Dois envios iguais ao mesmo tempo: o segundo encontra o primeiro.
    const winner = await repo.findByKey(input.idempotencyKey);
    if (!winner) throw new Error('Não foi possível registrar o contato');
    return winner;
  },

  async list(page: number, pageSize: number) {
    const { data, total } = await repo.list(page, pageSize);
    return { data, meta: { page, pageSize, total } };
  },

  async anonymize(id: string) {
    if (!(await repo.anonymize(id, now()))) {
      throw new NotFoundError('Pedido de contato não encontrado', 'CONTACT_NOT_FOUND');
    }
  },
});

export type ContactsService = ReturnType<typeof makeContactsService>;
