/**
 * /api/ws — live auction broadcast channel.
 *
 * Two transports, negotiated automatically:
 *
 *   1. **WebSocket.** When the app is served by the bundled custom server
 *      (`server.mjs`, `npm run dev:ws` / `npm run start:ws`), the server
 *      handles the HTTP `upgrade` on this path before Next.js sees the request
 *      and holds a persistent duplex socket. This is the primary transport.
 *
 *   2. **Server-Sent Events.** A plain `GET` against this route streams the
 *      identical message shapes as `text/event-stream`. This is what runs on
 *      Vercel's Edge/serverless, where a raw upgrade cannot be held open, and
 *      it is what the browser falls back to if the socket fails to open.
 *
 *   3. **Polling.** If neither transport survives — a proxy that buffers SSE,
 *      for instance — the client degrades to a 2-second poll of
 *      `/api/auction/[id]`. See `useAuctionChannel.ts`.
 *
 * Message shapes are defined by `AuctionMessage` in `src/lib/types.ts`.
 */

import { getLot } from '@/data/lots';
import { getBidHistory, getRoomState } from '@/lib/store';
import { subscribe, watchers } from '@/lib/realtime';
import type { AuctionMessage } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEARTBEAT_MS = 25_000;

/**
 * Reports the upgrade target to clients that probe the endpoint with a plain
 * GET and an `Accept: application/json` header.
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'X-WebSocket-Endpoint': '/api/ws',
      'X-WebSocket-Supported': 'true',
      'X-Fallback-Transport': 'server-sent-events',
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lotsParam = searchParams.get('lots') ?? searchParams.get('lot') ?? '';
  const lotSlugs = lotsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  // Content negotiation: a JSON probe gets a capability document.
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return Response.json({
      ok: true,
      endpoint: '/api/ws',
      transports: ['websocket', 'server-sent-events', 'polling'],
      heartbeatMs: HEARTBEAT_MS,
      subscriptions: lotSlugs,
      watchers: Object.fromEntries(lotSlugs.map((slug) => [slug, watchers(slug)])),
      messageTypes: ['hello', 'bid', 'state', 'presence', 'ping'],
      upgrade: 'Send Connection: Upgrade with Sec-WebSocket-Key to establish a WebSocket.',
    });
  }

  const encoder = new TextEncoder();
  const cleanups: (() => void)[] = [];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (message: AuctionMessage | { type: 'error'; message: string }) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // SSE comment line, flushes proxies that buffer until first byte.
      controller.enqueue(encoder.encode(`: lydia-auction-house live channel\n\n`));

      for (const slug of lotSlugs) {
        const lot = getLot(slug);
        if (!lot) {
          send({ type: 'error', message: `Unknown lot "${slug}".` });
          continue;
        }

        const [state, history] = await Promise.all([
          getRoomState(lot),
          getBidHistory(lot.id, 10),
        ]);

        send({ type: 'hello', state: { ...state, history }, serverTime: new Date().toISOString() });

        cleanups.push(
          subscribe(lot.id, (message) => {
            if (message.type === 'state') {
              // The SSE channel has no per-connection state to reconcile, so
              // a state change is delivered as a bid-shaped message carrying
              // the newest entry from the history.
              send({
                type: 'bid',
                state: message.state,
                bid: message.state.history[0] ?? {
                  id: 'unknown',
                  lotId: lot.id,
                  amount: message.state.currentBid,
                  bidder: 'Bidder',
                  at: message.state.updatedAt,
                },
              });
            } else {
              send(message);
            }
          }),
        );
      }

      const heartbeat = setInterval(() => {
        send({ type: 'ping', serverTime: new Date().toISOString() });
      }, HEARTBEAT_MS);

      const abort = () => {
        clearInterval(heartbeat);
        closed = true;
        cleanups.forEach((fn) => fn());
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener('abort', abort);
      cleanups.push(() => request.signal.removeEventListener('abort', abort));
    },

    cancel() {
      cleanups.forEach((fn) => fn());
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disables proxy buffering on nginx-family front ends.
      'X-Accel-Buffering': 'no',
    },
  });
}
