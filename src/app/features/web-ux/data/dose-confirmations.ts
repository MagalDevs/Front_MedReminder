import { isDoseInstant } from '../domain/agenda';

export type DoseConfirmation = { identityKey: string; id: number; expectedAt: string; registered: boolean };
const eventName = 'medreminder:dose-confirmed';
/** Tab-local confirmation only; credentials and treatment bodies never enter the event. */
export function publishDoseConfirmation(value: DoseConfirmation) {
  if (value.identityKey && Number.isSafeInteger(value.id) && value.id > 0 && isDoseInstant(value.expectedAt) && typeof value.registered === 'boolean') window.dispatchEvent(new CustomEvent(eventName, { detail: value }));
}
export function subscribeDoseConfirmations(identityKey: string, receive: (value: DoseConfirmation) => void) {
  const listener = (event: Event) => {
    const value = (event as CustomEvent<DoseConfirmation>).detail;
    if (value?.identityKey === identityKey && Number.isSafeInteger(value.id) && value.id > 0 && isDoseInstant(value.expectedAt) && typeof value.registered === 'boolean') receive(value);
  };
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
