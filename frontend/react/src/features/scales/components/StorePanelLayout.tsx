import { Link, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useScaleStore } from '../hooks/useScaleStore';
import { useScaleStores } from '../hooks/useScaleStores';

// Moldura do painel de uma loja: seletor de loja no topo e as abas.
export function StorePanelLayout() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { state, reload } = useScaleStore(id);
  const list = useScaleStores();

  const base = `/painel/lojas/${id}`;
  const tabs = [
    { to: `${base}/dados`, label: 'Dados da loja' },
    { to: `${base}/escala`, label: 'Escala' },
    { to: `${base}/diagnostico`, label: 'Diagnóstico e custos' },
    { to: `${base}/regras`, label: 'Regras aplicadas' },
  ];

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <FormMessage tone="error">{state.message}</FormMessage>
        <Link to="/painel" className="text-primary-strong underline">
          Voltar para minhas lojas
        </Link>
        <Button onClick={reload}>Tentar de novo</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/painel" className="text-primary-strong text-sm underline underline-offset-2">
            ← Minhas lojas
          </Link>
          {state.status === 'ready' ? (
            <>
              <h1 className="mt-2 text-2xl font-bold">{state.store.name}</h1>
              <p className="text-muted-foreground text-sm">
                {state.store.city}/{state.store.state}
              </p>
            </>
          ) : (
            <Skeleton className="mt-2 h-10 w-64" />
          )}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="store-switch" className="text-muted-foreground text-xs">
              Loja
            </label>
            <select
              id="store-switch"
              value={id}
              onChange={(e) => navigate(`/painel/lojas/${e.target.value}/diagnostico`)}
              className="border-input bg-background rounded-lg border p-2 text-sm"
            >
              {list.state.status === 'ready'
                ? list.state.stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                : null}
            </select>
          </div>
          <Link
            to="/painel/lojas/nova"
            className="bg-accent text-primary-strong hover:bg-rp-50 inline-flex items-center rounded-md px-3 py-2 text-xs font-bold"
          >
            Nova loja
          </Link>
        </div>
      </div>

      <Tabs items={tabs} label="Seções da loja" />

      {state.status === 'ready' ? (
        <Outlet context={{ store: state.store, reload }} />
      ) : (
        <Skeleton className="h-64" />
      )}
    </div>
  );
}

export function StoreIndexRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={`/painel/lojas/${id}/diagnostico`} replace />;
}
