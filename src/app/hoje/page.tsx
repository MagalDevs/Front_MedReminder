import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import TodayScreen from '../features/web-ux/screens/TodayScreen';

export default function TodayPage() {
  return <ProtectedRoute><TodayScreen /></ProtectedRoute>;
}
