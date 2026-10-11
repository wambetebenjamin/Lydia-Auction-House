/**
 * POST /api/newsletter
 *
 * Newsletter signup. Stored in Vercel KV, gated by reCAPTCHA v3
 * (action `newsletter_signup`). Duplicate addresses are reported as success so
 * the endpoint cannot be used to enumerate subscribers.
 */

import { NextResponse } from 'next/server';
import { CAPTCHA_ACTIONS, captchaGate, clientIp } from '@/lib/captcha';
import { addSubscriber, rateLimit } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const limit = Number(process.env.RATE_LIMIT_FORM_PER_MIN ?? '5');
  const ip = clientIp(request.headers) ?? 'unknown';

  const quota = await rateLimit('newsletter', ip, limit);
  if (!quota.allowed) {
    return NextResponse.json(
      { ok: false, code: 'rate_limited', message: 'Too many signups from this connection.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  let body: { email?: string; captchaToken?: string; source?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad_request', message: 'Expected a JSON body.' },
      { status: 400 },
    );
  }

  if (!body.email || !EMAIL_RE.test(body.email)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'validation',
        errors: { email: 'Please enter a valid email address.' },
        message: 'Please enter a valid email address.',
      },
      { status: 422 },
    );
  }

  const gate = await captchaGate(body.captchaToken, CAPTCHA_ACTIONS.newsletter, ip);
  if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });

  const added = await addSubscriber(body.email, body.source ?? 'footer');

  return NextResponse.json(
    {
      ok: true,
      alreadySubscribed: !added,
      message: added
        ? 'You are on the list. Auction dates, new arrivals and artist spotlights, in your inbox.'
        : 'You are already on the list — nothing further needed.',
    },
    { status: added ? 201 : 200 },
  );
}
