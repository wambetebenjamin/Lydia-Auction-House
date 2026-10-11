'use client';

/**
 * Client half of the reCAPTCHA v3 integration (see `src/lib/captcha.ts` for the
 * server half). The site key is public by design; the secret never leaves the
 * server.
 *
 * If no site key is configured, `getCaptchaToken` resolves to an empty string and
 * the request proceeds. That is the correct behaviour in local development; in
 * production the server refuses every gated request outright when
 * `RECAPTCHA_SECRET_KEY` is absent, so an unconfigured deployment fails closed.
 */

export const CAPTCHA_ACTIONS = {
  bid: 'bid_submit',
  bidderRegister: 'bidder_register',
  purchase: 'direct_purchase',
  submission: 'artist_submission',
  contact: 'contact_enquiry',
  newsletter: 'newsletter_signup',
} as const;

export type CaptchaAction = (typeof CAPTCHA_ACTIONS)[keyof typeof CAPTCHA_ACTIONS];

type Grecaptcha = {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let scriptPromise: Promise<void> | null = null;

function siteKey(): string {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
}

export function captchaConfigured(): boolean {
  return siteKey().length > 0;
}

/** Injects the reCAPTCHA v3 script once, lazily, on first use. */
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  const key = siteKey();
  if (!key) return Promise.resolve();

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (window.grecaptcha) return resolve();

    const existing = document.querySelector<HTMLScriptElement>('script[data-lah-recaptcha]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('reCAPTCHA failed to load.')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}`;
    script.async = true;
    script.defer = true;
    script.dataset.lahRecaptcha = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('reCAPTCHA failed to load.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Obtains a v3 token for the given action.
 * Never throws — a CAPTCHA outage must not make the site unusable. The server
 * makes the final call, and it fails closed when it should.
 */
export async function getCaptchaToken(action: CaptchaAction): Promise<string> {
  if (!captchaConfigured()) return '';
  try {
    await loadScript();
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) return '';
    return await new Promise<string>((resolve) => {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(siteKey(), { action })
          .then(resolve)
          .catch(() => resolve(''));
      });
    });
  } catch {
    return '';
  }
}

export interface GatedResponse {
  ok: boolean;
  code?: string;
  /** Present when the server asks for the v2 checkbox fallback. */
  fallback?: string;
  message?: string;
  errors?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * POSTs a gated payload, transparently retrying once with a v2 token when the
 * server answers 428 `challenge_required`.
 *
 * @param getV2Token Supplied by the caller when it renders the v2 checkbox.
 */
export async function postGated(
  url: string,
  payload: Record<string, unknown>,
  action: CaptchaAction,
  getV2Token?: () => Promise<string>,
): Promise<GatedResponse> {
  const token = await getCaptchaToken(action);

  const send = async (captchaToken: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, captchaToken }),
    });
    return (await response.json()) as GatedResponse & { code?: string };
  };

  let result = await send(token);

  if (!result.ok && result.code === 'challenge_required' && getV2Token) {
    const v2Token = await getV2Token();
    if (v2Token) result = await send(v2Token);
  }

  return result;
}
