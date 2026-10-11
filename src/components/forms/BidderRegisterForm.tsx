'use client';

/**
 * Bidder registration — issues a paddle number.
 *
 * reCAPTCHA v3, action `bidder_register`. On success the paddle is stored in
 * `localStorage` so the auction room can greet the bidder by it, and the record
 * is persisted server-side in the KV store.
 */

import { useId, useRef, useState } from 'react';
import Link from 'next/link';
import { CAPTCHA_ACTIONS, getCaptchaToken } from '@/lib/captcha-client';
import { CaptchaFallback } from './CaptchaFallback';
import { Field, inputClass } from './SubmissionForm';
import { site } from '@/lib/site';

const COUNTRIES = [
  'Kenya',
  'Uganda',
  'Tanzania',
  'Ethiopia',
  'Rwanda',
  'South Africa',
  'United Kingdom',
  'United States',
  'United Arab Emirates',
  'Other',
];

interface BidderRegisterFormProps {
  mode?: 'register' | 'signin';
  className?: string;
}

export function BidderRegisterForm({ mode = 'register', className = '' }: BidderRegisterFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [paddle, setPaddle] = useState('');
  const [needsV2, setNeedsV2] = useState(false);
  const uid = useId();
  /** Held so the v2 fallback can resend the same registration. */
  const pending = useRef<Record<string, unknown> | null>(null);

  async function register(payload: Record<string, unknown>, captchaToken: string) {
    const response = await fetch('/api/bidder/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, captchaToken }),
    });
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      errors?: Record<string, string>;
      fallback?: string;
      bidder?: { paddleNumber: string; name: string; handle: string };
    };

    if (result.ok && result.bidder) {
      setState('done');
      setPaddle(result.bidder.paddleNumber);
      setMessage(result.message ?? 'Paddle issued.');
      try {
        window.localStorage.setItem(
          'lah:bidder',
          JSON.stringify({
            paddle: result.bidder.paddleNumber,
            name: result.bidder.name,
            handle: result.bidder.handle,
          }),
        );
      } catch {
        /* storage blocked — the session still works */
      }
      setNeedsV2(false);
      return;
    }

    if (result.fallback === 'recaptcha_v2') {
      setNeedsV2(true);
      setState('idle');
      setMessage('Please complete the verification below.');
      return;
    }

    setState('error');
    setErrors(result.errors ?? {});
    setMessage(result.message ?? 'We could not complete that registration.');
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, unknown> = {};
    for (const [key, value] of data.entries()) {
      payload[key] = key === 'consent' ? value === 'on' : value;
    }

    pending.current = payload;
    setState('sending');
    setErrors({});
    setMessage('');

    try {
      const token = await getCaptchaToken(CAPTCHA_ACTIONS.bidderRegister);
      await register(payload, token);
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (state === 'done') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-[var(--radius-lg)] border-2 border-[var(--secondary)] bg-[rgba(140,198,65,0.1)] p-8 ${className}`}
      >
        <p className="eyebrow text-[#3F5C18]">Registered</p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
          Your paddle is{' '}
          <span className="font-[family-name:var(--font-condensed)] text-[var(--secondary)]">
            {paddle}
          </span>
        </h3>
        <p className="mt-3 max-w-[54ch] text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
          {message} You can bid on any live lot now. Your paddle is also saved on this device, so the
          auction room will know you when you come back.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/live-auctions" className="pill-btn pill-btn--dark">
            Go to the live sale
          </Link>
          <Link href="/lots" className="pill-btn pill-btn--ghost">
            Browse the catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      {mode === 'signin' ? (
        <p className="mb-5 rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--text-meta)] text-[var(--ink-muted)]">
          Enter the email and phone number you registered with and we will reissue your paddle.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${uid}-name`} label="Full name" error={errors.name} required>
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-invalid={Boolean(errors.name) || undefined}
            className={inputClass(Boolean(errors.name))}
          />
        </Field>

        <Field id={`${uid}-email`} label="Email" error={errors.email} required>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.email) || undefined}
            className={inputClass(Boolean(errors.email))}
          />
        </Field>

        <Field
          id={`${uid}-phone`}
          label="Phone"
          hint="We use this to confirm high-value bids, and never for marketing."
          error={errors.phone}
          required
        >
          <input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+254 7…"
            aria-invalid={Boolean(errors.phone) || undefined}
            className={inputClass(Boolean(errors.phone))}
          />
        </Field>

        <Field id={`${uid}-country`} label="Country">
          <select
            id={`${uid}-country`}
            name="country"
            defaultValue="Kenya"
            className={inputClass(false)}
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="mt-6">
        <legend className="meta mb-2">Terms</legend>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--line)] px-4 py-3 transition-colors duration-200 hover:bg-[var(--surface-raised)]">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={Boolean(errors.consent) || undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--dark)]"
          />
          <span className="text-[var(--text-meta)] leading-relaxed text-[var(--ink-muted)]">
            I have read and accept the{' '}
            <Link href="/legal/terms" className="underline decoration-2 underline-offset-2">
              auction terms
            </Link>
            , including the 15% buyer&rsquo;s premium and the payment deadlines. I confirm I am over
            18 and bidding on my own behalf unless I have told the house otherwise.
          </span>
        </label>
        {errors.consent ? (
          <p role="alert" className="mt-1.5 text-[11px] text-[var(--status-danger)]">
            {errors.consent}
          </p>
        ) : null}
      </fieldset>

      {needsV2 ? (
        <CaptchaFallback
          className="mt-6"
          onToken={async (token) => {
            if (!pending.current) {
              setNeedsV2(false);
              return;
            }
            setNeedsV2(false);
            setState('sending');
            setMessage('Verifying…');
            try {
              await register(pending.current, token);
            } catch {
              setState('error');
              setMessage('Network error. Please try again.');
            }
          }}
        />
      ) : null}

      <button
        type="submit"
        disabled={state === 'sending'}
        aria-busy={state === 'sending'}
        className="pill-btn pill-btn--dark mt-6 w-full sm:w-auto"
      >
        {state === 'sending'
          ? 'Issuing paddle…'
          : mode === 'signin'
            ? 'Reissue my paddle'
            : 'Register to Bid'}
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`mt-3 min-h-[1.25rem] text-[var(--text-meta)] ${
          state === 'error' ? 'text-[var(--status-danger)]' : 'text-[var(--ink-muted)]'
        }`}
      >
        {message}
      </p>

      <p className="text-[11px] leading-relaxed text-[var(--ink-subtle)]">
        Protected by reCAPTCHA. Registration is free and creates no obligation to bid. Contact the
        house at {site.email} to close your registration at any time.
      </p>
    </form>
  );
}
