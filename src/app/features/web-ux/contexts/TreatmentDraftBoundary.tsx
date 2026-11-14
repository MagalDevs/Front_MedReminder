'use client';

import { type ReactNode } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { TreatmentDraftProvider } from './TreatmentDraftContext';

/** Lives under AuthProvider and above route children; profile metadata is not a new identity. */
export default function TreatmentDraftBoundary({ children }: { children: ReactNode }) {
  const { identityKey } = useAuth();
  return <TreatmentDraftProvider identity={identityKey}>{children}</TreatmentDraftProvider>;
}
