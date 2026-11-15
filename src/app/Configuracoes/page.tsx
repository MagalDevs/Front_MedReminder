import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import ProfileScreen from '../features/web-ux/screens/ProfileScreen';

export default function ProfilePage() {
  return <ProtectedRoute><ProfileScreen /></ProtectedRoute>;
}
