/**
 * Lydia Auction House — custom server.
 *
 * Next.js alone cannot hold a raw WebSocket open in a route handler, so this
 * server wraps the Next request handler and intercepts the HTTP `upgrade` on
 * `/api/ws` before Next.js sees it. Everything else is delegated untouched.
 *
 *   npm run dev:ws     development, with WebSockets
 *   npm run start:ws   production, with WebSockets
 *
 * The realtime hub is deliberately held on `globalThis.__lahHub` with exactly
 * the shape `src/lib/realtime.ts` expects. Because both this file and the
 * compiled application resolve the hub through `globalThis`, a bid accepted by
 * the `/api/bid` route handler is delivered to every socket attached here — the
 * two share one pub/sub without sharing a module registry.
 *
 * Without this server (`next dev` / `next start`), the browser automatically
 * falls back to the SSE channel at the same path, and then to 2-second polling.
 */

import { createServer } from 'node:http';
import { parse } from 'node:url';
import { WebSocketServer } from 'ws';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3000);

/* ── Shared hub ─────────────────────────────────────────────────────────────
   Mirrors src/lib/realtime.ts. Established before Next.js is imported so the
   application picks up this instance rather than creating its own. */
if (!globalThis.__lahHub) {
  globalThis.__lahHub = { listeners: new Map(), presence: new Map() };
}
const hub = globalThis.__lahHub;

const HEARTBEAT_MS = 25_000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

/** Attaches a socket to every lot id it asked for and streams state changes. */
function attach(socket, lotIds) {
  const cleanups = [];

  const send = (payload) => {
    if (socket.readyState !== socket.OPEN) return;
    try {
      socket.send(JSON.stringify(payload));
    } catch {
      /* socket died mid-write; the close handler will clean up */
    }
  };

  for (const lotId of lotIds) {
    const listeners = hub.listeners.get(lotId) ?? new Set();
    const listener = (message) => send(message);
    listeners.add(listener);
    hub.listeners.set(lotId, listeners);

    hub.presence.set(lotId, (hub.presence.get(lotId) ?? 0) + 1);
    send({
      type: 'presence',
      lotId,
      watchers: hub.presence.get(lotId),
    });

    cleanups.push(() => {
      const current = hub.listeners.get(lotId);
      if (current) {
        current.delete(listener);
        if (current.size === 0) hub.listeners.delete(lotId);
      }
      const remaining = Math.max(0, (hub.presence.get(lotId) ?? 1) - 1);
      hub.presence.set(lotId, remaining);
      // Let remaining subscribers see the presence change.
      const remainingListeners = hub.listeners.get(lotId);
      if (remainingListeners) {
        for (const other of remainingListeners) {
          try {
            other({ type: 'presence', lotId, watchers: remaining });
          } catch {
            /* ignore */
          }
        }
      }
    });
  }

  const heartbeat = setInterval(() => {
    send({ type: 'ping', serverTime: new Date().toISOString() });
  }, HEARTBEAT_MS);

  const teardown = () => {
    clearInterval(heartbeat);
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
  };

  socket.on('close', teardown);
  socket.on('error', teardown);
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname, query } = parse(request.url, true);

    if (pathname !== '/api/ws') {
      // Not ours — let Next.js handle its own HMR/dev upgrades.
      return;
    }

    const raw = query.lots ?? query.lot ?? '';
    const lotIds = String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
      attach(ws, lotIds);
    });
  });

  server.listen(port, hostname, () => {
    const url = `http://${hostname === '0.0.0.0' ? 'localhost' : hostname}:${port}`;
    console.log(`\n  ▲ Lydia Auction House — ${dev ? 'development' : 'production'}`);
    console.log(`  ─ App        ${url}`);
    console.log(`  ─ WebSocket  ws://localhost:${port}/api/ws?lots=<comma,separated,slugs>`);
    console.log(`  ─ Fallbacks  Server-Sent Events at the same path, then 2s polling\n`);
  });

  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
