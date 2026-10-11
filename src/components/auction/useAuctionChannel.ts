'use client';

/**
 * EFFECT-05 — Real-time collaborative bidding channel.
 *
 * Transport ladder, negotiated automatically and reported to the UI:
 *
 *   1. **WebSocket** at `/api/ws?lots=<slugs>`. Available wherever the bundled
 *      custom server is running (`npm run dev:ws` / `sync start:ws`). This is
 *      the primary transport and gives true server push.
 *   2. **Server-Sent Events** at the same path, used when the upgrade fails —
 *      the deployment target for Vercel, where a raw duplex socket cannot be
 *      held open.
 *   3. **Polling** `/api/auction/[id]` every `NEXT_PUBLIC_BID_POLL_MS`
 *      (default 2000 ms), which the brief requires as a fallback in any case.
 *
 * Behaviours required by the brief, and where they live:
 *   • current bid / bid count / bidder count update live → `applyState`
 *   • optimistic local updates for bid submission → `submitBid`
 *   • auto-reconnect on disconnect → `scheduleReconnect` (exponential backoff,
 *     capped at 15 s, reset on a successful connection)
 *   • graceful single-bidder state → `bidderCount <= 1` renders no dots
 *   • reduced motion: no animations, polling continues
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuctionMessage, AuctionRoomState, Bid } from '@/lib/types';

export type ChannelStatus = 'connecting' | 'websocket' | 'sse' | 'polling' | 'offline';

export interface AuctionChannel {
  state: AuctionRoomState | null;
  history: Bid[];
  status: ChannelStatus;
  /** Watchers reported by the server, over and above local presence. */
  watchers: number;
  lastError: string | null;
  /** True while a locally-optimistic bid is awaiting confirmation. */
  pendingBid: number | null;
  submitBid: (amount: number, payload?: BidSubmissionPayload) => Promise<BidOutcome>;
  refresh: () => Promise<void>;
}

export interface BidSubmissionPayload {
  name?: string;
  email?: string;
  sessionId?: string;
  captchaToken?: string;
}

export type BidOutcome =
  | { ok: true; message: string }
  | { ok: false; message: string; code?: string; fallback?: string };

const POLL_MS = Number(process.env.NEXT_PUBLIC_BID_POLL_MS ?? '2000');
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? '';

function socketUrl(lotSlug: string): string {
  if (WS_URL) {
    const base = WS_URL.replace(/\/$/, '');
    return `${base}?lots=${encodeURIComponent(lotSlug)}`;
  }
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/ws?lots=${encodeURIComponent(lotSlug)}`;
}

function sseUrl(lotSlug: string): string {
  return `/api/ws?lots=${encodeURIComponent(lotSlug)}`;
}

export function useAuctionChannel(lotSlug: string | undefined): AuctionChannel {
  const [state, setState] = useState<AuctionRoomState | null>(null);
  const [history, setHistory] = useState<Bid[]>([]);
  const [status, setStatus] = useState<ChannelStatus>('connecting');
  const [watchers, setWatchers] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [pendingBid, setPendingBid] = useState<number | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<number | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const closedRef = useRef(false);
  const seenBidIds = useRef(new Set<string>());

  /* ── State application, shared by every transport ─────────────────────── */
  const applyState = useCallback((next: AuctionRoomState) => {
    setState(next);
    if (next.history?.length) {
      setHistory(next.history.slice(0, 10));
      next.history.forEach((bid) => seenBidIds.current.add(bid.id));
    }
  }, []);

  const applyMessage = useCallback(
    (message: AuctionMessage) => {
      switch (message.type) {
        case 'hello':
        case 'state':
          applyState(message.state);
          break;
        case 'bid': {
          applyState(message.state);
          // Guard against re-announcing a bid already in the list.
          if (!seenBidIds.current.has(message.bid.id)) {
            seenBidIds.current.add(message.bid.id);
            setHistory((current) => [message.bid, ...current].slice(0, 10));
            announce(
              `New bid of KES ${message.bid.amount.toLocaleString('en-KE')} by ${message.bid.bidder}.`,
            );
          }
          break;
        }
        case 'presence':
          setWatchers(message.watchers);
          break;
        case 'ping':
          break;
        default:
          break;
      }
    },
    [applyState],
  );

  /* ── REST refresh — the fallback path and the reconciliation path ─────── */
  const refresh = useCallback(async () => {
    if (!lotSlug) return;
    try {
      const response = await fetch(`/api/auction/${encodeURIComponent(lotSlug)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        ok: boolean;
        state?: AuctionRoomState;
        watchers?: number;
      };
      if (payload.ok && payload.state) {
        applyState(payload.state);
        if (typeof payload.watchers === 'number') setWatchers(payload.watchers);
        setLastError(null);
      }
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Could not reach the auction room.');
    }
  }, [lotSlug, applyState]);

  /* ── Polling ──────────────────────────────────────────────────────────── */
  const startPolling = useCallback(() => {
    if (pollRef.current !== null) return;
    setStatus('polling');
    void refresh();
    pollRef.current = window.setInterval(() => void refresh(), POLL_MS);
  }, [refresh]);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  /* ── Reconnect with exponential backoff, capped ───────────────────────── */
  const scheduleReconnect = useCallback(() => {
    if (closedRef.current) return;
    if (reconnectRef.current !== null) return;
    const attempt = (attemptRef.current += 1);
    // 800ms, 1.6s, 3.2s, 6.4s, 12.8s, then 15s for ever.
    const delay = Math.min(800 * 2 ** (attempt - 1), 15_000);
    setStatus('offline');
    reconnectRef.current = window.setTimeout(() => {
      reconnectRef.current = null;
      connect();
    }, delay);
  }, []);

  /* ── Transport negotiation ────────────────────────────────────────────── */
  const connect = useCallback(() => {
    if (!lotSlug || closedRef.current) return;
    if (typeof window === 'undefined') return;

    // Never stack transports.
    if (socketRef.current && socketRef.current.readyState <= WebSocket.OPEN) return;
    if (sseRef.current) return;

    setStatus((current) => (current === 'offline' ? 'connecting' : current));

    let settled = false;

    /* 1 — WebSocket */
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(socketUrl(lotSlug));
    } catch {
      socket = null;
    }

    if (!socket) {
      startSseFallback();
      return;
    }

    const upgradeToSse = () => {
      if (settled) return;
      settled = true;
      try {
        socket?.close();
      } catch {
        /* ignore */
      }
      socketRef.current = null;
      startSseFallback();
    };

    // If the handshake has not completed quickly, stop waiting and degrade.
    const handshakeTimer = window.setTimeout(upgradeToSse, 3500);

    socket.onopen = () => {
      settled = true;
      window.clearTimeout(handshakeTimer);
      socketRef.current = socket;
      attemptRef.current = 0;
      stopPolling();
      setStatus('websocket');
      setLastError(null);
      // Resync immediately: anything missed while offline is picked up here.
      void refresh();
    };

    socket.onmessage = (event) => {
      try {
        applyMessage(JSON.parse(event.data as string) as AuctionMessage);
      } catch {
        /* ignore malformed frames */
      }
    };

    socket.onerror = () => {
      if (!settled) upgradeToSse();
    };

    socket.onclose = () => {
      window.clearTimeout(handshakeTimer);
      if (socketRef.current === socket) socketRef.current = null;
      if (closedRef.current) return;
      if (!settled) {
        upgradeToSse();
        return;
      }
      scheduleReconnect();
    };

    /* 2 — Server-Sent Events */
    function startSseFallback() {
      if (closedRef.current || !lotSlug) return;
      let source: EventSource;
      try {
        source = new EventSource(sseUrl(lotSlug));
      } catch {
        startPolling();
        return;
      }

      let opened = false;
      const guard = window.setTimeout(() => {
        // SSE that has not opened in 4 s is treated as unavailable.
        if (!opened) {
          source.close();
          startPolling();
        }
      }, 4000);

      source.onopen = () => {
        opened = true;
        window.clearTimeout(guard);
        sseRef.current = source;
        attemptRef.current = 0;
        stopPolling();
        setStatus('sse');
        setLastError(null);
      };

      source.onmessage = (event) => {
        try {
          applyMessage(JSON.parse(event.data as string) as AuctionMessage);
        } catch {
          /* ignore */
        }
      };

      source.onerror = () => {
        window.clearTimeout(guard);
        if (sseRef.current === source) sseRef.current = null;
        source.close();
        if (closedRef.current) return;
        // Fall straight through to polling, then keep trying to upgrade back.
        startPolling();
        scheduleReconnect();
      };
    }
  }, [lotSlug, applyMessage, refresh, scheduleReconnect, startPolling, stopPolling]);

  useEffect(() => {
    closedRef.current = false;
    attemptRef.current = 0;
    seenBidIds.current.clear();
    connect();

    return () => {
      closedRef.current = true;
      if (reconnectRef.current !== null) window.clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
      stopPolling();
      try {
        socketRef.current?.close();
      } catch {
        /* ignore */
      }
      socketRef.current = null;
      try {
        sseRef.current?.close();
      } catch {
        /* ignore */
      }
      sseRef.current = null;
    };
  }, [connect, stopPolling]);

  /* A tab returning to the foreground resyncs immediately. */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  /* ── Bid submission with an optimistic local entry ────────────────────── */
  const submitBid = useCallback(
    async (amount: number, payload: BidSubmissionPayload = {}): Promise<BidOutcome> => {
      if (!lotSlug) return { ok: false, message: 'No lot selected.' };

      const previous = state;
      const optimistic: Bid = {
        id: `optimistic-${Date.now()}`,
        lotId: state?.lotId ?? lotSlug,
        amount,
        bidder: payload.name?.trim() || 'You',
        at: new Date().toISOString(),
        pending: true,
      };

      // Optimistic local update.
      setPendingBid(amount);
      if (previous) {
        setState({
          ...previous,
          currentBid: amount,
          nextBid: amount,
          bidCount: previous.bidCount + 1,
          history: [optimistic, ...previous.history].slice(0, 10),
        });
      }
      setHistory((current) => [optimistic, ...current].slice(0, 10));

      try {
        const response = await fetch('/api/bid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lotSlug, amount, ...payload }),
        });
        const result = (await response.json()) as {
          ok: boolean;
          message?: string;
          code?: string;
          fallback?: string;
          bid?: Bid;
          state?: AuctionRoomState;
        };

        if (result.ok && result.state) {
          applyState({ ...result.state, history: result.state.history ?? history });
          return { ok: true, message: result.message ?? 'Bid placed.' };
        }

        // Roll the optimistic entry back to the last authoritative state.
        if (previous) {
          setState(previous);
          setHistory(previous.history.slice(0, 10));
        }
        void refresh();
        return {
          ok: false,
          message: result.message ?? 'The bid was not accepted.',
          code: result.code,
          fallback: result.fallback,
        };
      } catch {
        if (previous) setState(previous);
        void refresh();
        return {
          ok: false,
          message: 'We could not reach the auction room. Your bid was not placed.',
        };
      } finally {
        setPendingBid(null);
      }
    },
    [lotSlug, state, applyState, refresh, history],
  );

  return useMemo(
    () => ({ state, history, status, watchers, lastError, pendingBid, submitBid, refresh }),
    [state, history, status, watchers, lastError, pendingBid, submitBid, refresh],
  );
}

function announce(message: string): void {
  const region = document.getElementById('lah-live-region');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 40);
}
