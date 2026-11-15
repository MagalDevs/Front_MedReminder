import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import HistoryScreen from '../features/web-ux/screens/HistoryScreen';

export default function HistoryPage() {
  return <ProtectedRoute><HistoryScreen /></ProtectedRoute>;
}
