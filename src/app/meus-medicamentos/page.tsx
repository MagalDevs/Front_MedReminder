import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import MedicationsScreen from '../features/web-ux/screens/MedicationsScreen';

export default function MedicationsPage() {
  return <ProtectedRoute><MedicationsScreen /></ProtectedRoute>;
}
