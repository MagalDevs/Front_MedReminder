import ProtectedRoute from '../../../components/ProtectedRoute/ProtectedRoute';
import MedicationEditScreen from '../../../features/web-ux/screens/MedicationEditScreen';

export default async function MedicationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const medicationId = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) ? Number(id) : NaN;
  return <ProtectedRoute><MedicationEditScreen medicationId={medicationId} /></ProtectedRoute>;
}
