/**
 * POST /api/captcha
 *
 * Server-side reCAPTCHA v3 verification.
 *
 * Used two ways:
 *   1. As a standalone pre-flight, so a client can learn it needs the v2
 *      fallback before it assembles a longer submission.
 *   2. Internally, by every other gated route via `captchaGate()`.
 *
 * The secret is read only server-side. No configuration detail is disclosed to
 * the caller beyond whether the challenge is required.
 */

import { NextResponse } from 'next/server';
import { CAPTCHA_ACTIONS, type CaptchaAction, devBypassEnabled, threshold, verifyCaptcha, clientIp } from '@/lib/captcha';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ACTIONS = new Set<string>(Object.values(CAPTCHA_ACTIONS));

/** Exposes only non-secret configuration to the browser. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: 'recaptcha-v3',
    invisible: true,
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? null,
    fallbackSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY ?? null,
    fallbackProvider: 'recaptcha-v2-checkbox',
    threshold: threshold(),
    actions: Object.values(CAPTCHA_ACTIONS),
    devBypass: devBypassEnabled(),
  });
}

export async function POST(request: Request) {
  let body: { token?: string; action?: string };
  try {
    body = (await request.json()) as { token?: string; action?: string };
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad_request', message: 'Expected a JSON body.' },
      { status: 400 },
    );
  }

  const action = body.action ?? CAPTCHA_ACTIONS.contact;
  if (!VALID_ACTIONS.has(action)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'bad_action',
        message: `Unknown action. Expected one of: ${Array.from(VALID_ACTIONS).join(', ')}.`,
      },
      { status: 400 },
    );
  }

  const verdict = await verifyCaptcha(body.token, action as CaptchaAction, clientIp(request.headers));

  if (verdict.status === 'pass') {
    return NextResponse.json({
      ok: true,
      verified: true,
      action,
      score:
        'score' in verdict ? Number(verdict.score.toFixed(2)) : null,
    });
  }

  if (verdict.status === 'challenge') {
    return NextResponse.json(
      {
        ok: false,
        verified: false,
        code: 'challenge_required',
        fallback: 'recaptcha_v2',
        action,
        score: Number(verdict.score.toFixed(2)),
        message: 'Additional verification is required. Please complete the checkbox challenge.',
      },
      { status: 428 },
    );
  }

  return NextResponse.json(
    { ok: false, verified: false, code: 'verification_failed', message: verdict.reason },
    { status: 400 },
  );
}
