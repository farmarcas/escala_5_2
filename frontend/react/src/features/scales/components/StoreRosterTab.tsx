import { useOutletContext } from 'react-router-dom';
import type { PanelContext } from './StoreDataTab';
import { RosterScreen } from './RosterScreen';

export function StoreRosterTab() {
  const { store } = useOutletContext<PanelContext>();
  return <RosterScreen key={store.updatedAt} store={store} />;
}
