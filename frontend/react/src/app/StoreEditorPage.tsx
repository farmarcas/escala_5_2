import { useParams } from 'react-router-dom';
import { StoreEditorScreen } from '@/features/stores';

export function StoreEditorPage() {
  const { id } = useParams();
  return <StoreEditorScreen storeId={id} />;
}
