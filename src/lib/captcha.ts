/**
 * Google reCAPTCHA v3 (invisible) verification — server side.
 *
 * The design source shipped no CAPTCHA of any kind (DESIGN-INVENTORY.md §6),
 * so the provider and this contract are defined here.
 *
 * Contract:
 *   1. The client obtains a v3 token for a named action (see CAPTCHA_ACTIONS).
 *   2. The server POSTs `secret` + `response` to Google's siteverify endpoint.
 *   3. Google returns `success` and a `score` in [0, 1].
 *   4. If `success` but `score < RECAPTCHA_SCORE_THRESHOLD` (default 0.5), the
 *      caller must present the v2 checkbox fallback and resubmit with a v2 token.
 *
 * The secret key is read from `RECAPTCHA_SECRET_KEY` and never leaves the
 * server. It is never returned in a response body or written to a log.
 */

import 'server-only';

export const CAPTCHA_ACTIONS = {
  bid: 'bid_submit',
  bidderRegister: 'bidder_register',
  purchase: 'direct_purchase',
  submission: 'artist_submission',
  contact: 'contact_enquiry',
  newsletter: 'newsletter_signup',
} as const;

export type CaptchaAction = (typeof CAPTCHA_ACTIONS)[keyof typeof CAPTCHA_ACTIONS];

export type CaptchaVerdict =
  /** Verified with a comfortable score — proceed. */
  | { status: 'pass'; score: number; action?: string; hostname?: string }
  /** v3 succeeded but the score is below threshold — demand the v2 fallback. */
  | { status: 'challenge'; score: number; reason: string }
  /** Token missing, malformed, expired or rejected — reject the request. */
  | { status: 'fail'; score: number; reason: string };

const VERIFY_ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';

function secret(): string {
  return process.env.RECAPTCHA_SECRET_KEY ?? '';
}

export function threshold(): number {
  const parsed = Number(process.env.RECAPTCHA_SCORE_THRESHOLD ?? '0.5');
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.5;
}

/**
 * The bypass exists purely so the application is exercisable in local
 * development and CI, where no Google credentials are configured. It is
 * refused outright in a production build.
 */
export function devBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.RECAPTCHA_DEV_BYPASS === 'true';
}

interface SiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verifies a reCAPTCHA token.
 *
 * @param token    The token from grecaptcha.enterprise/client execute(), or the
 *                 `g-recaptcha-response` field for the v2 fallback.
 * @param action   The action name the token was minted for. v3 tokens carry the
 *                 action, and a mismatch is treated as a failure.
 * @param remoteIp Optional client IP, forwarded to Google to improve scoring.
 */
export async function verifyCaptcha(
  token: string | undefined | null,
  action: CaptchaAction,
  remoteIp?: string,
): Promise<CaptchaVerdict> {
  if (devBypassEnabled()) {
    return { status: 'pass', score: 1, action, reason: 'dev-bypass' } as CaptchaVerdict & {
      reason: string;
    };
  }

  if (!secret()) {
    // Misconfiguration must fail closed, never open.
    return {
      status: 'fail',
      score: 0,
      reason: 'RECAPTCHA_SECRET_KEY is not configured on the server.',
    };
  }

  if (!token || typeof token !== 'string' || token.length < 20) {
    return { status: 'fail', score: 0, reason: 'Missing or malformed CAPTCHA token.' };
  }

  const body = new URLSearchParams({ secret: secret(), response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  let payload: SiteVerifyResponse;
  try {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      cache: 'no-store',
    });
    if (!response.ok) {
      return { status: 'fail', score: 0, reason: `siteverify returned HTTP ${response.status}.` };
    }
    payload = (await response.json()) as SiteVerifyResponse;
  } catch {
    // Network failure to Google must not silently admit the request.
    return { status: 'fail', score: 0, reason: 'Could not reach the CAPTCHA verifier.' };
  }

  if (!payload.success) {
    const codes = payload['error-codes']?.join(', ') ?? 'unknown error';
    return { status: 'fail', score: 0, reason: `CAPTCHA rejected (${codes}).` };
  }

  const score = typeof payload.score === 'number' ? payload.score : 1;

  // v2 checkbox responses carry no action and no score; treat them as pass.
  if (payload.score === undefined) {
    return { status: 'pass', score: 1, action: payload.action, hostname: payload.hostname };
  }

  if (payload.action && payload.action !== action) {
    return {
      status: 'fail',
      score,
      reason: `CAPTCHA action mismatch (expected "${action}", received "${payload.action}").`,
    };
  }

  if (score < threshold()) {
    return {
      status: 'challenge',
      score,
      reason: `Score ${score.toFixed(2)} is below the ${threshold()} threshold.`,
    };
  }

  return { status: 'pass', score, action: payload.action, hostname: payload.hostname };
}

/** Convenience guard for route handlers. */
export async function captchaGate(
  token: string | undefined | null,
  action: CaptchaAction,
  remoteIp?: string,
): Promise<{ ok: true } | { ok: false; status: number; body: Record<string, unknown> }> {
  const verdict = await verifyCaptcha(token, action, remoteIp);

  if (verdict.status === 'pass') return { ok: true };

  if (verdict.status === 'challenge') {
    return {
      ok: false,
      status: 428,
      body: {
        ok: false,
        code: 'captcha_challenge',
        // The client swaps in the v2 checkbox and resubmits.
        fallback: 'recaptcha_v2',
        message: 'Please complete the verification challenge to continue.',
      },
    };
  }

  return {
    ok: false,
    status: 400,
    body: { ok: false, code: 'captcha_failed', message: verdict.reason },
  };
}

export function clientIp(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    undefined
  );
}
