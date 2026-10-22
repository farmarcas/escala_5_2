import { useParams } from 'react-router-dom';
import {
  CompareScreen,
  SavedSimulationDetail,
  SavedSimulationsScreen,
} from '@/features/simulations';

export const SavedSimulationsPage = () => <SavedSimulationsScreen />;
export const CompareSimulationsPage = () => <CompareScreen />;

export function SavedSimulationPage() {
  const { id = '' } = useParams();
  return <SavedSimulationDetail id={id} key={id} />;
}
