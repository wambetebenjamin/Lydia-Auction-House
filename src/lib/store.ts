/**
 * Persistence layer.
 *
 * Production: Vercel KV (REST). Falls back transparently to Upstash-native
 * variable names, then to a process-local memory driver so the application is
 * fully functional before storage is provisioned.
 *
 * Keyspace (all prefixed `lah:`):
 *   lah:room:<lotId>          AuctionRoomState JSON
 *   lah:bids:<lotId>          Bid[] JSON, newest first, capped at 200
 *   lah:bidder:<sessionId>    registered bidder record, TTL 30d
 *   lah:seen:<lotId>:<who>    dedupe marker for bidder counting
 *   lah:newsletter            subscriber list
 *   lah:submission:<id>       seller submission record
 */

import 'server-only';
import type { AuctionRoomState, Bid, Lot } from './types';
import { nextBidAmount, bidIncrement } from './format';

const PREFIX = 'lah';
const BID_HISTORY_CAP = 200;
const ROOM_TTL_SECONDS = 7 * 24 * 60 * 60;

/* ── Driver resolution ───────────────────────────────────────────────────── */

type Driver = {
  name: string;
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  list<T>(key: string): Promise<T[]>;
  push<T>(key: string, value: T, cap: number): Promise<void>;
  incr(key: string): Promise<number>;
  sadd(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
};

const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const KV_READONLY_TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN ?? KV_TOKEN;

/**
 * Minimal Redis-over-REST client. The same wire protocol is served by Vercel KV
 * and Upstash Redis, so one implementation covers both.
 */
function restDriver(url: string, token: string): Driver {
  async function command<T>(...args: (string | number)[]): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`KV command failed: ${response.status} ${await response.text()}`);
    }
    const payload = (await response.json()) as { result?: T; error?: string };
    if (payload.error) throw new Error(`KV error: ${payload.error}`);
    return payload.result as T;
  }

  const parse = <T>(raw: unknown): T | null => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== 'string') return raw as T;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  };

  return {
    name: 'vercel-kv',
    async get<T>(key: string) {
      return parse<T>(await command<unknown>('GET', key));
    },
    async set(key, value, ttlSeconds) {
      if (ttlSeconds) await command('SET', key, JSON.stringify(value), 'EX', ttlSeconds);
      else await command('SET', key, JSON.stringify(value));
    },
    async del(key) {
      await command('DEL', key);
    },
    async list<T>(key: string) {
      return parse<T[]>(await command<unknown>('GET', key)) ?? [];
    },
    async push<T>(key: string, value: T, cap: number) {
      const current = (await parse<T[]>(await command<unknown>('GET', key))) ?? [];
      const next = [value, ...current].slice(0, cap);
      await command('SET', key, JSON.stringify(next));
    },
    async incr(key) {
      return (await command<number>('INCR', key)) ?? 0;
    },
    async sadd(key, member) {
      return (await command<number>('SADD', key, member)) ?? 0;
    },
    async smembers(key) {
      return (await command<string[]>('SMEMBERS', key)) ?? [];
    },
  };
}

/**
 * Memory driver. Held on `globalThis` so it survives Next.js dev HMR and is
 * shared between route handlers and the WebSocket hub in a single process.
 */
interface MemoryBucket {
  values: Map<string, { value: unknown; expiresAt: number | null }>;
  sets: Map<string, Set<string>>;
}

const globalForStore = globalThis as unknown as { __lahMemory?: MemoryBucket };

const bucket: MemoryBucket =
  globalForStore.__lahMemory ??
  (globalForStore.__lahMemory = { values: new Map(), sets: new Map() });

function memoryDriver(): Driver {
  const live = (key: string) => {
    const entry = bucket.values.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      bucket.values.delete(key);
      return null;
    }
    return entry;
  };

  return {
    name: 'memory',
    async get<T>(key: string) {
      return (live(key)?.value as T) ?? null;
    },
    async set(key, value, ttlSeconds) {
      bucket.values.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
      });
    },
    async del(key) {
      bucket.values.delete(key);
      bucket.sets.delete(key);
    },
    async list<T>(key: string) {
      return (live(key)?.value as T[]) ?? [];
    },
    async push<T>(key: string, value: T, cap: number) {
      const current = (live(key)?.value as T[]) ?? [];
      bucket.values.set(key, {
        value: [value, ...current].slice(0, cap),
        expiresAt: null,
      });
    },
    async incr(key) {
      const current = Number(live(key)?.value ?? 0) + 1;
      bucket.values.set(key, { value: current, expiresAt: null });
      return current;
    },
    async sadd(key, member) {
      const set = bucket.sets.get(key) ?? new Set<string>();
      const sizeBefore = set.size;
      set.add(member);
      bucket.sets.set(key, set);
      return set.size === sizeBefore ? 0 : 1;
    },
    async smembers(key) {
      return Array.from(bucket.sets.get(key) ?? []);
    },
  };
}

export const driver: Driver =
  KV_URL && KV_TOKEN ? restDriver(KV_URL, KV_READONLY_TOKEN || KV_TOKEN) : memoryDriver();

export const storeIsDurable = driver.name !== 'memory';

/* ── Room state ──────────────────────────────────────────────────────────── */

const roomKey = (lotId: string) => `${PREFIX}:room:${lotId}`;
const bidsKey = (lotId: string) => `${PREFIX}:bids:${lotId}`;
const seenKey = (lotId: string) => `${PREFIX}:seen:${lotId}`;

/** Derives the initial room state from a lot's declared seed values. */
export function seedFromLot(lot: Lot): AuctionRoomState {
  return {
    lotId: lot.id,
    currentBid: lot.currentBid,
    bidCount: lot.bidCount,
    bidderCount: lot.bidderCount,
    nextBid: lot.bidCount === 0 ? lot.startingBid : nextBidAmount(lot.currentBid),
    reserveMet: lot.reserve === 0 || lot.currentBid >= lot.reserve,
    status: lot.status,
    closesAt: lot.closesAt,
    buyNowPrice: lot.buyNowPrice,
    history: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function getRoomState(lot: Lot): Promise<AuctionRoomState> {
  const stored = await driver.get<AuctionRoomState>(roomKey(lot.id));
  const seed = seedFromLot(lot);
  if (!stored) return seed;

  // A stored room may pre-date a redeploy; re-take anything structural from the
  // canonical lot record and keep only the live, mutable fields from storage.
  return {
    ...seed,
    currentBid: stored.currentBid ?? seed.currentBid,
    bidCount: stored.bidCount ?? seed.bidCount,
    bidderCount: stored.bidderCount ?? seed.bidderCount,
    nextBid: stored.nextBid ?? seed.nextBid,
    reserveMet: stored.reserveMet ?? seed.reserveMet,
    history: stored.history ?? [],
    updatedAt: stored.updatedAt ?? seed.updatedAt,
  };
}

export async function saveRoomState(state: AuctionRoomState): Promise<void> {
  await driver.set(roomKey(state.lotId), state, ROOM_TTL_SECONDS);
}

export async function getBidHistory(lotId: string, limit = 10): Promise<Bid[]> {
  const bids = await driver.list<Bid>(bidsKey(lotId));
  return bids.slice(0, limit);
}

export async function getAllBids(lotId: string): Promise<Bid[]> {
  return driver.list<Bid>(bidsKey(lotId));
}

export interface PlaceBidInput {
  lot: Lot;
  amount: number;
  /** Opaque public handle. Never a real identity. */
  bidder: string;
  /** Stable per-session id, used only to count distinct bidders. */
  sessionId: string;
}

export interface PlaceBidResult {
  ok: boolean;
  /** Present when ok is true. */
  state?: AuctionRoomState;
  bid?: Bid;
  /** Machine-readable reason when ok is false. */
  reason?: 'too-low' | 'reserve' | 'closed' | 'not-live' | 'bad-amount';
  message?: string;
}

/**
 * Records a bid. Serialised per lot through a promise chain so two concurrent
 * requests cannot both read the same `currentBid` and undercut one another.
 */
const locks = new Map<string, Promise<unknown>>();

function withLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const next = previous.then(task, task);
  locks.set(
    key,
    next.catch(() => undefined),
  );
  return next;
}

export async function placeBid(input: PlaceBidInput): Promise<PlaceBidResult> {
  const { lot, amount, bidder, sessionId } = input;

  return withLock(roomKey(lot.id), async () => {
    const state = await getRoomState(lot);

    if (state.status !== 'live') {
      return { ok: false, reason: 'not-live', message: 'This lot is not currently open for bidding.' };
    }
    if (new Date(state.closesAt).getTime() <= Date.now()) {
      return { ok: false, reason: 'closed', message: 'This lot has closed.' };
    }
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
      return { ok: false, reason: 'bad-amount', message: 'Bid must be a whole number of shillings.' };
    }
    if (amount < state.nextBid) {
      return {
        ok: false,
        reason: 'too-low',
        message: `Bid must be at least KES ${state.nextBid.toLocaleString('en-KE')}.`,
      };
    }

    const bid: Bid = {
      id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      lotId: lot.id,
      amount,
      bidder,
      at: new Date().toISOString(),
    };

    const distinct = await driver.sadd(seenKey(lot.id), sessionId);

    const nextState: AuctionRoomState = {
      ...state,
      currentBid: amount,
      nextBid: nextBidAmount(amount),
      bidCount: state.bidCount + 1,
      bidderCount: state.bidderCount + (distinct === 1 ? 1 : 0),
      reserveMet: lot.reserve === 0 || amount >= lot.reserve,
      history: [bid, ...state.history].slice(0, BID_HISTORY_CAP),
      updatedAt: new Date().toISOString(),
    };

    await Promise.all([saveRoomState(nextState), driver.push(bidsKey(lot.id), bid, BID_HISTORY_CAP)]);

    return { ok: true, state: nextState, bid };
  });
}

export const bidIncrementFor = bidIncrement;

/* ── Bidder sessions ─────────────────────────────────────────────────────── */

export interface BidderRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** Public-facing masked handle, e.g. "Bidder 41". */
  handle: string;
  paddleNumber: string;
  createdAt: string;
  verified: boolean;
}

const bidderKey = (id: string) => `${PREFIX}:bidder:${id}`;

export async function saveBidder(record: BidderRecord): Promise<void> {
  await driver.set(bidderKey(record.id), record, 30 * 24 * 60 * 60);
}

export async function getBidder(id: string): Promise<BidderRecord | null> {
  return driver.get<BidderRecord>(bidderKey(id));
}

/* ── Newsletter ──────────────────────────────────────────────────────────── */

export interface NewsletterSubscriber {
  email: string;
  at: string;
  source: string;
}

const NEWSLETTER_KEY = `${PREFIX}:newsletter`;

export async function addSubscriber(email: string, source: string): Promise<boolean> {
  const list = await driver.list<NewsletterSubscriber>(NEWSLETTER_KEY);
  const normalised = email.trim().toLowerCase();
  if (list.some((entry) => entry.email === normalised)) return false;
  await driver.push<NewsletterSubscriber>(
    NEWSLETTER_KEY,
    { email: normalised, at: new Date().toISOString(), source },
    BID_HISTORY_CAP,
  );
  return true;
}

/* ── Seller submissions ──────────────────────────────────────────────────── */

export interface SubmissionRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  artworkType: string;
  estimateRange: string;
  description: string;
  photos: string[];
  at: string;
}

export async function saveSubmission(record: SubmissionRecord): Promise<void> {
  await driver.set(`${PREFIX}:submission:${record.id}`, record, 180 * 24 * 60 * 60);
  await driver.push(`${PREFIX}:submissions`, record, 500);
}

/* ── Rate limiting ───────────────────────────────────────────────────────── */

/**
 * Fixed-window counter. Uses the KV driver when durable storage is configured,
 * otherwise the process-local memory driver.
 */
export async function rateLimit(
  bucketName: string,
  identifier: string,
  limitPerMinute: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const window = Math.floor(Date.now() / 60_000);
  const key = `${PREFIX}:rl:${bucketName}:${identifier}:${window}`;
  const count = await driver.incr(key);
  if (count === 1) {
    await driver.set(key, count, 120);
  }
  return {
    allowed: count <= limitPerMinute,
    remaining: Math.max(0, limitPerMinute - count),
    resetAt: (window + 1) * 60_000,
  };
}
