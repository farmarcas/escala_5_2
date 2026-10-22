import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { NumberField } from '@/components/ui/NumberField';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { useSubmit } from '@/hooks/useSubmit';
import { useAuth } from '../hooks/useAuth';
import type { GroupInfo } from '../types';
import { validateGroupForm, type GroupFormValues } from '../validateAuthForms';
import { FormMessage } from './FormMessage';

const REGIME_OPTIONS: { value: GroupInfo['taxRegime']; label: string }[] = [
  { value: 'real', label: 'Lucro Real' },
  { value: 'presumido', label: 'Lucro Presumido' },
  { value: 'simples', label: 'Simples Nacional' },
];

type LoadedProps = { user: { name: string; email: string }; group: GroupInfo };

function GroupForm({ group }: { group: GroupInfo }) {
  const { updateGroup } = useAuth();
  const [values, setValues] = useState<GroupFormValues>({
    name: group.name,
    annualRevenue: group.annualRevenue,
  });
  const [regime, setRegime] = useState(group.taxRegime);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { submit, isSubmitting, error } = useSubmit(() =>
    updateGroup({
      name: values.name.trim(),
      taxRegime: regime,
      annualRevenue: values.annualRevenue,
    }),
  );

  const errors = showErrors ? validateGroupForm(values) : {};

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    setIsSaved(false);
    if (Object.keys(validateGroupForm(values)).length > 0) return;
    if (await submit(undefined)) setIsSaved(true);
  };

  return (
    <form
      className="bg-background border-border flex flex-col gap-4 rounded-lg border p-5"
      onSubmit={handleSubmit}
      noValidate
    >
      <h2 className="text-lg font-semibold">Dados do grupo</h2>
      <p className="text-muted-foreground text-sm">
        O regime tributário e o faturamento são o ponto de partida das suas simulações; em cada
        simulação você ainda pode ajustá-los.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nome do grupo ou da rede"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          error={errors.name}
        />
        <SelectField
          label="Regime tributário"
          value={regime}
          options={REGIME_OPTIONS}
          onValueChange={setRegime}
        />
        <NumberField
          label="Faturamento anual (opcional)"
          value={values.annualRevenue}
          prefix="R$"
          onValueChange={(value) => setValues({ ...values, annualRevenue: value })}
          error={errors.annualRevenue}
        />
      </div>
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      {isSaved ? <FormMessage tone="success">Dados salvos.</FormMessage> : null}
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar dados do grupo'}
        </Button>
      </div>
    </form>
  );
}

function DeleteAccount() {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const { submit, isSubmitting, error, clearError } = useSubmit(async (value: string) => {
    await deleteAccount(value);
    navigate('/');
  });

  const close = () => {
    clearError();
    setPassword('');
    setIsOpen(false);
  };

  return (
    <section className="bg-background border-border flex flex-col gap-3 rounded-lg border p-5">
      <h2 className="text-lg font-semibold">Excluir minha conta</h2>
      <p className="text-muted-foreground text-sm">
        Apaga a sua conta e todos os dados do grupo: lojas, equipes e dados do painel. Não dá para
        desfazer. Se você já pediu contato a um consultor, esse pedido fica com a Farmarcas; para
        removê-lo, peça a eliminação dos dados ao consultor.
      </p>
      <div>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Excluir minha conta
        </Button>
      </div>

      <Modal isOpen={isOpen} title="Excluir a conta?" onClose={close}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (password) void submit(password);
          }}
        >
          <p className="text-sm">
            Para confirmar, digite a sua senha. Tudo o que foi cadastrado no grupo será apagado.
          </p>
          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <FormMessage tone="error">{error}</FormMessage> : null}
          <div className="flex gap-3">
            <Button type="submit" variant="danger" disabled={isSubmitting || !password}>
              {isSubmitting ? 'Excluindo…' : 'Excluir definitivamente'}
            </Button>
            <Button variant="secondary" onClick={close} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

function Loaded({ user, group }: LoadedProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <p className="text-muted-foreground text-sm">
          {user.name} · {user.email}
        </p>
      </div>
      <GroupForm group={group} />
      <DeleteAccount />
    </div>
  );
}

export function AccountScreen() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;
  return <Loaded user={state.user} group={state.group} />;
}
