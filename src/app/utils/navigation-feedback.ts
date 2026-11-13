export type NavigationFeedback = 'registered' | 'session-expired';

// Only static presentation codes live here. Never retain credentials or form data.
let pending: NavigationFeedback | null = null;
const listeners = new Set<() => void>();

export function publishNavigationFeedback(feedback: NavigationFeedback) {
  pending = feedback;
  listeners.forEach((listener) => listener());
}

/** Keeps a mounted login informed without putting messages in URLs or storage. */
export function subscribeNavigationFeedback(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function consumeNavigationFeedback(): NavigationFeedback | null {
  const feedback = pending;
  pending = null;
  return feedback;
}

export function clearNavigationFeedback() {
  pending = null;
}
