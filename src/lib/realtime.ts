/**
 * Realtime broadcast hub.
 *
 * An in-process pub/sub used by:
 *   • the custom WebSocket server (`server.mjs`, attached at /api/ws)
 *   • the SSE fallback in `src/app/api/ws/route.ts`
 *   • the bid route, which publishes on every accepted bid
 *
 * On Vercel's Edge/serverless runtimes there is no stable in-process socket, so
 * the client transparently degrades to 2-second polling of
 * `/api/auction/[id]` — which the brief requires as a fallback in any case.
 * Recovery, reconnect with backoff and presence counting live in
 * `src/components/auction/useAuctionChannel.ts`.
 */

import type { AuctionMessage, AuctionRoomState } from './types';

type Listener = (message: AuctionMessage) => void;

interface Hub {
  listeners: Map<string, Set<Listener>>;
  /** lotId → number of currently attached transports */
  presence: Map<string, number>;
}

const globalForHub = globalThis as unknown as { __lahHub?: Hub };

const hub: Hub =
  globalForHub.__lahHub ?? (globalForHub.__lahHub = { listeners: new Map(), presence: new Map() });

export function subscribe(lotId: string, listener: Listener): () => void {
  const set = hub.listeners.get(lotId) ?? new Set<Listener>();
  set.add(listener);
  hub.listeners.set(lotId, set);

  hub.presence.set(lotId, (hub.presence.get(lotId) ?? 0) + 1);
  publish(lotId, { type: 'presence', watchers: hub.presence.get(lotId) ?? 1 });

  return () => {
    const current = hub.listeners.get(lotId);
    current?.delete(listener);
    if (current && current.size === 0) hub.listeners.delete(lotId);
    const remaining = Math.max(0, (hub.presence.get(lotId) ?? 1) - 1);
    hub.presence.set(lotId, remaining);
  };
}

export function publish(lotId: string, message: AuctionMessage): void {
  const set = hub.listeners.get(lotId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(message);
    } catch {
      // A broken transport must never take down the publisher.
    }
  }
}

export function broadcastState(lotId: string, state: AuctionRoomState): void {
  publish(lotId, { type: 'state', state });
}

export function watchers(lotId: string): number {
  return hub.presence.get(lotId) ?? 0;
}

export function activeLots(): string[] {
  return Array.from(hub.listeners.keys());
}
