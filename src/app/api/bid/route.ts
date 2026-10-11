/**
 * POST /api/bid
 *
 * Validates a bid (above current, above reserve), saves it to Vercel KV and
 * broadcasts it to every attached WebSocket session via the realtime hub.
 *
 * Rate limited per IP. CAPTCHA-gated with reCAPTCHA v3 action `bid_submit`.
 */

import { NextResponse } from 'next/server';
import { getLot } from '@/data/lots';
import { CAPTCHA_ACTIONS, captchaGate, clientIp } from '@/lib/captcha';
import { getBidHistory, placeBid, rateLimit } from '@/lib/store';
import { broadcastState } from '@/lib/realtime';
import { formatKES } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BidBody {
  lotSlug?: string;
  amount?: number | string;
  /** reCAPTCHA v3 token for action `bid_submit`, or a v2 token on fallback. */
  captchaToken?: string;
  name?: string;
  email?: string;
  /** Stable anonymous session id, used only to count distinct bidders. */
  sessionId?: string;
}

/** Deterministic, non-identifying public handle derived from the session id. */
function bidderHandle(sessionId: string, name?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0];
    const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : '';
    return `${first}${lastInitial}`;
  }
  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) % 1_000_000;
  }
  return `Bidder ${(hash % 90) + 10}`;
}

export async function POST(request: Request) {
  const limit = Number(process.env.RATE_LIMIT_BID_PER_MIN ?? '12');
  const ip = clientIp(request.headers) ?? 'unknown';

  const quota = await rateLimit('bid', ip, limit);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: 'rate_limited',
        message: 'Too many bids from this connection. Please slow down.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((quota.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  let body: BidBody;
  try {
    body = (await request.json()) as BidBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad_request', message: 'Expected a JSON body.' },
      { status: 400 },
    );
  }

  const lot = body.lotSlug ? getLot(body.lotSlug) : undefined;
  if (!lot) {
    return NextResponse.json(
      { ok: false, code: 'not_found', message: 'Unknown lot.' },
      { status: 404 },
    );
  }

  const gate = await captchaGate(body.captchaToken, CAPTCHA_ACTIONS.bid, ip);
  if (!gate.ok) {
    return NextResponse.json(gate.body, { status: gate.status });
  }

  const amount = typeof body.amount === 'string' ? Number(body.amount.replace(/[^\d]/g, '')) : body.amount;
  const sessionId = body.sessionId?.trim() || `anon-${ip}`;

  const result = await placeBid({
    lot,
    amount: Number(amount),
    bidder: bidderHandle(sessionId, body.name),
    sessionId,
  });

  if (!result.ok || !result.state) {
    const status =
      result.reason === 'too-low' || result.reason === 'reserve' || result.reason === 'bad-amount'
        ? 422
        : 409;
    return NextResponse.json(
      {
        ok: false,
        code: result.reason ?? 'rejected',
        message: result.message ?? 'Bid rejected.',
        state: result.state ?? null,
      },
      { status },
    );
  }

  // Push to every attached session (EFFECT-05) — the bidder's own optimistic
  // entry is reconciled against this authoritative state.
  broadcastState(lot.id, result.state);

  return NextResponse.json(
    {
      ok: true,
      message: `Bid of ${formatKES(result.state.currentBid)} placed on ${lot.title}.`,
      bid: result.bid,
      state: {
        ...result.state,
        history: await getBidHistory(lot.id, 10),
      },
    },
    { status: 201, headers: { 'X-RateLimit-Remaining': String(quota.remaining) } },
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, code: 'method_not_allowed', message: 'Use POST to place a bid.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
