import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, SESSION_INVALIDATED_EVENT } from '@/app/utils/api';

const sessionId = 'a'.repeat(32);
const accessToken = (sid: string, signature: string) => `test.${btoa(JSON.stringify({ sid }))}.${signature}`;
const expired = accessToken(sessionId, 'expired');
const renewed = accessToken(sessionId, 'renewed');
const refreshPath = '/auth/session/refresh';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('automatic web session renewal', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', expired);
    localStorage.setItem('user_data', '{"id":1}');
  });

  it('shares one renewal across requests and retries using the replacement token and original request options', async () => {
    const calls: { url: string; authorization: string | null; idempotencyKey: string | null; body: BodyInit | null | undefined }[] = [];
    vi.mocked(fetch).mockImplementation(async (url, options) => {
      const headers = new Headers(options?.headers);
      const authorization = headers.get('authorization');
      calls.push({ url: String(url), authorization, body: options?.body, idempotencyKey: headers.get('idempotency-key') });
      if (url === refreshPath) {
        expect(headers.get('x-medreminder-session-id')).toBe(sessionId);
        expect(options?.credentials).toBe('same-origin');
        return json({ access_token: renewed, session_id: sessionId });
      }
      return authorization === `Bearer ${expired}` ? json({}, 401) : json({ ok: true });
    });

    const payload = JSON.stringify({ sample: 'original request' });
    await expect(Promise.all([
      apiRequest('private/read'),
      apiRequest('private/write', { method: 'POST', body: payload, headers: { 'Idempotency-Key': 'test-key' } }),
    ])).resolves.toEqual([{ ok: true }, { ok: true }]);

    expect(calls.filter(({ url }) => url === refreshPath)).toHaveLength(1);
    expect(calls.filter(({ url }) => url.endsWith('/private/write')).map(({ authorization, idempotencyKey, body }) => ({ authorization, idempotencyKey, body }))).toEqual([
      { authorization: `Bearer ${expired}`, idempotencyKey: 'test-key', body: payload },
      { authorization: `Bearer ${renewed}`, idempotencyKey: 'test-key', body: payload },
    ]);
    expect(localStorage.getItem('access_token')).toBe(renewed);
    expect(localStorage.getItem('user_data')).toBe('{"id":1}');
  });

  it('invalidates the session when the refresh credential is rejected', async () => {
    vi.mocked(fetch).mockImplementation(async () => json({}, 401));
    const invalidate = vi.fn();
    window.addEventListener(SESSION_INVALIDATED_EVENT, invalidate, { once: true });
    await expect(apiRequest('private')).rejects.toMatchObject({ status: 401 });
    expect(invalidate).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
    window.removeEventListener(SESSION_INVALIDATED_EVENT, invalidate);
  });

  it('preserves the session on temporary refresh failure or an operational 401', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => json({}, url === refreshPath ? 503 : 401));
    await expect(apiRequest('usuario/senha', { method: 'PATCH', onUnauthorized: 'throw' })).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1);
    await expect(apiRequest('private')).rejects.toMatchObject({ status: 503 });
    expect(localStorage.getItem('access_token')).toBe(expired);
  });

  it('discards a response from renewal if the user has switched accounts', async () => {
    const otherToken = accessToken('b'.repeat(32), 'other');
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (url !== refreshPath) return json({}, 401);
      localStorage.setItem('access_token', otherToken);
      return json({ access_token: renewed, session_id: sessionId });
    });
    await expect(apiRequest('private')).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('access_token')).toBe(otherToken);
  });
});
