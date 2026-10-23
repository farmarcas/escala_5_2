import { Outlet } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { AccountMenu } from '@/features/auth';

export function AppLayout() {
  return (
    <PageShell headerActions={<AccountMenu />}>
      <Outlet />
    </PageShell>
  );
}
