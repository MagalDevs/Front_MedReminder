export function getAccessToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem('access_token');
}

export function getWebSessionId(token = getAccessToken()): string | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    // Only read the session identifier. Authentication still happens on the server.
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (claims && typeof claims === 'object' && 'sid' in claims &&
        typeof claims.sid === 'string' && /^[a-f0-9]{32}$/.test(claims.sid)) return claims.sid;
  } catch {
    return null;
  }
  return null;
}

export function getSessionIdentity(token = getAccessToken()) {
  const sessionId = getWebSessionId(token);
  return sessionId ? `web:${sessionId}` : token;
}

export function saveAccessToken(token: string) {
  localStorage.setItem('access_token', token);
}

export function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_data');
}
