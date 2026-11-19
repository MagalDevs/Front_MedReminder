import type { NextRequest } from 'next/server';
import { buildApiUrl } from '../../../utils/api-url';
import {
  refreshCookieName, sessionIdHeader, webSessionHeader, webSessionPath,
} from '../../../utils/web-session-protocol';

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (action !== 'login' && action !== 'refresh' && action !== 'logout') {
    return new Response(null, { status: 404, headers });
  }
  if (request.headers.get(webSessionHeader) !== '1') {
    return new Response(null, { status: 403, headers });
  }

  const upstreamHeaders = new Headers({ [webSessionHeader]: '1' });
  const sessionId = request.headers.get(sessionIdHeader);
  const cookie = request.cookies.get(refreshCookieName)?.value;
  if (sessionId) upstreamHeaders.set(sessionIdHeader, sessionId);
  if (cookie && /^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(cookie)) {
    upstreamHeaders.set('Cookie', `${refreshCookieName}=${cookie}`);
  }
  if (action === 'login') upstreamHeaders.set('Content-Type', 'application/json');

  try {
    const upstream = await fetch(buildApiUrl(`${webSessionPath}/${action}`), {
      method: 'POST',
      headers: upstreamHeaders,
      body: action === 'login' ? await request.text() : undefined,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    for (const key of ['content-type', 'retry-after', 'set-cookie']) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return Response.json({ message: 'Serviço de autenticação indisponível.' }, { status: 502, headers });
  }
}
