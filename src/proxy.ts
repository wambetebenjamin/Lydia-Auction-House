/**
 * Proxy (the Next.js 16 successor to `middleware.ts`).
 *
 * Runs on the Node.js runtime, before every `/api/*` request.
 *
 * Responsibilities:
 *   • A cheap, first-line rate limit on the bid and form endpoints, before a
 *     request reaches a route handler. Authoritative, durable limiting happens
 *     in the handlers themselves against Vercel KV (`src/lib/store.ts`); this
 *     layer exists to shed obvious floods before they reach a handler.
 *   • A request id on every response, so a bid can be traced end-to-end.
 *   • No-store headers on all API responses.
 */

import { NextResponse, type NextRequest } from 'next/server';

export const config = {
  matcher: ['/api/:path*'],
};

/** Sliding window, held per proxy instance. Best-effort by design. */
const WINDOWS = new Map<string, number[]>();

const LIMITS: Record<string, number> = {
  '/api/bid': Number(process.env.RATE_LIMIT_BID_PER_MIN ?? 12),
  '/api/bidder/register': Number(process.env.RATE_LIMIT_FORM_PER_MIN ?? 5),
  '/api/newsletter': Number(process.env.RATE_LIMIT_FORM_PER_MIN ?? 5),
  '/api/contact': Number(process.env.RATE_LIMIT_FORM_PER_MIN ?? 5),
  '/api/submission': Number(process.env.RATE_LIMIT_FORM_PER_MIN ?? 5),
  '/api/captcha': 30,
};

const WINDOW_MS = 60_000;

function clientKey(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'anonymous'
  );
}

function check(key: string, limit: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const stamps = (WINDOWS.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (stamps.length >= limit) {
    WINDOWS.set(key, stamps);
    return { allowed: false, remaining: 0 };
  }

  stamps.push(now);
  WINDOWS.set(key, stamps);

  // Keep the map from growing without bound on a long-lived instance.
  if (WINDOWS.size > 5_000) {
    for (const [k, v] of WINDOWS) {
      if (v.every((t) => now - t >= WINDOW_MS)) WINDOWS.delete(k);
    }
  }

  return { allowed: true, remaining: limit - stamps.length };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  const limit = LIMITS[pathname];
  if (limit !== undefined && request.method === 'POST') {
    const { allowed, remaining } = check(`${pathname}:${clientKey(request)}`, limit);

    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: 'rate_limited',
          message: 'Too many requests. Please wait a moment and try again.',
          requestId,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
            'X-Request-Id': requestId,
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}
