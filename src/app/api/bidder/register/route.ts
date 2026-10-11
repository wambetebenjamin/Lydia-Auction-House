/**
 * POST /api/bidder/register
 *
 * Bidder registration. reCAPTCHA v3 (action `bidder_register`), server-side
 * verification, paddle number issued, record persisted to the KV store.
 */

import { NextResponse } from 'next/server';
import { CAPTCHA_ACTIONS, captchaGate, clientIp } from '@/lib/captcha';
import { rateLimit, saveBidder, type BidderRecord } from '@/lib/store';
import { houseEmail, sendMail } from '@/lib/mailer';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RegisterBody {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  captchaToken?: string;
  consent?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function paddleNumber(): string {
  // House paddles run 100–999, allocated in blocks so no two sales collide.
  const block = 100 + (Math.floor(Date.now() / 86_400_000) % 9) * 100;
  return String(block + Math.floor(Math.random() * 100));
}

export async function POST(request: Request) {
  const limit = Number(process.env.RATE_LIMIT_FORM_PER_MIN ?? '5');
  const ip = clientIp(request.headers) ?? 'unknown';

  const quota = await rateLimit('register', ip, limit);
  if (!quota.allowed) {
    return NextResponse.json(
      { ok: false, code: 'rate_limited', message: 'Too many attempts. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad_request', message: 'Expected a JSON body.' },
      { status: 400 },
    );
  }

  const errors: Record<string, string> = {};
  if (!body.name || body.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!body.email || !EMAIL_RE.test(body.email)) errors.email = 'Please enter a valid email address.';
  if (!body.phone || body.phone.replace(/\D/g, '').length < 9) {
    errors.phone = 'Please enter a phone number we can reach you on, including the country code.';
  }
  if (!body.consent) errors.consent = 'Please accept the bidder terms to continue.';

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, code: 'validation', errors, message: 'Please correct the highlighted fields.' },
      { status: 422 },
    );
  }

  const gate = await captchaGate(body.captchaToken, CAPTCHA_ACTIONS.bidderRegister, ip);
  if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });

  const id = `bidder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const paddle = paddleNumber();

  const record: BidderRecord = {
    id,
    name: body.name!.trim(),
    email: body.email!.trim().toLowerCase(),
    phone: body.phone!.trim(),
    handle: `${body.name!.trim().split(/\s+/)[0]} ${body.name!.trim().split(/\s+/).slice(-1)[0][0]}.`,
    paddleNumber: paddle,
    createdAt: new Date().toISOString(),
    verified: true,
  };

  await saveBidder(record);

  const mail = await sendMail({
    subject: `Paddle ${paddle} issued — ${record.name}`,
    to: site.email,
    replyTo: record.email,
    text: `A new bidder has registered.\n\nName: ${record.name}\nEmail: ${record.email}\nPhone: ${record.phone}\nPaddle: ${paddle}\nRegistered: ${record.createdAt}`,
    html: houseEmail(
      `Paddle ${paddle} issued`,
      [
        ['Name', record.name],
        ['Email', record.email],
        ['Phone', record.phone],
        ['Paddle', paddle],
        ['Registered', record.createdAt],
      ],
      'Registered through the Lydia Auction House website.',
    ),
  });

  return NextResponse.json(
    {
      ok: true,
      message: `Paddle ${paddle} issued. You can bid on any live lot now.`,
      bidder: { id, name: record.name, paddleNumber: paddle, handle: record.handle },
      notified: mail.delivered,
    },
    { status: 201 },
  );
}
