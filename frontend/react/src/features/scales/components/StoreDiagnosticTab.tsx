import { useOutletContext } from 'react-router-dom';
import { DiagnosticScreen } from './DiagnosticScreen';
import type { PanelContext } from './StoreDataTab';

export function StoreDiagnosticTab() {
  const { store } = useOutletContext<PanelContext>();
  return <DiagnosticScreen key={store.updatedAt} store={store} />;
}
