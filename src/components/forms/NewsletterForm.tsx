'use client';

/**
 * Newsletter signup — reCAPTCHA v3, action `newsletter_signup`.
 *
 * Rendered in the footer and again on the home page. Both instances carry the
 * brief's copy verbatim: "Auction dates, new arrivals, and artist spotlights
 * delivered to your inbox."
 */

import { useId, useState } from 'react';
import { CAPTCHA_ACTIONS, postGated } from '@/lib/captcha-client';

interface NewsletterFormProps {
  className?: string;
  source?: string;
  /** `dark` for the ink footer, `light` for a paper section. */
  tone?: 'dark' | 'light';
}

export function NewsletterForm({ className = '', source = 'footer', tone = 'dark' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fieldId = useId();

  const isDark = tone === 'dark';

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === 'sending') return;

    setState('sending');
    setMessage('');

    try {
      const result = await postGated(
        '/api/newsletter',
        { email, source },
        CAPTCHA_ACTIONS.newsletter,
      );

      if (result.ok) {
        setState('done');
        setMessage(String(result.message ?? 'You are on the list.'));
        setEmail('');
      } else {
        setState('error');
        setMessage(
          result.errors?.email ??
            String(result.message ?? 'We could not add that address just now.'),
        );
      }
    } catch {
      setState('error');
      setMessage('Network error. Please try again, or message us on WhatsApp.');
    }
  }

  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      <label htmlFor={`${fieldId}-email`} className="sr-only">
        Email address
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`${fieldId}-email`}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state === 'error') setState('idle');
          }}
          aria-invalid={state === 'error' || undefined}
          aria-describedby={`${fieldId}-status`}
          placeholder="you@example.com"
          className={`min-h-12 w-full rounded-[var(--radius-md)] border px-3 text-[var(--text-ui)] outline-none transition-colors duration-200 focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--primary)]/45 ${
            isDark
              ? 'border-[var(--line-ink-strong)] bg-white/8 text-white placeholder:text-white/45'
              : 'border-[var(--line-strong)] bg-white text-[var(--ink)] placeholder:text-[var(--ink-subtle)]'
          } ${state === 'error' ? 'border-[var(--status-danger)]' : ''}`}
        />
        <button
          type="submit"
          disabled={state === 'sending' || state === 'done'}
          aria-busy={state === 'sending'}
          className="pill-btn pill-btn--primary min-h-12 shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === 'sending' ? 'Signing up…' : state === 'done' ? 'Subscribed' : 'Sign Up'}
        </button>
      </div>

      <p
        id={`${fieldId}-status`}
        role="status"
        aria-live="polite"
        className={`mt-2 min-h-[1.25rem] text-[var(--text-meta)] ${
          state === 'error'
            ? 'text-[#F0A9A2]'
            : isDark
              ? 'text-[var(--secondary)]'
              : 'text-[var(--status-success)]'
        }`}
      >
        {message}
      </p>

      <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/45' : 'text-[var(--ink-subtle)]'}`}>
        We send roughly one email a fortnight, and never pass your address to anyone. This form is
        protected by reCAPTCHA.
      </p>
    </form>
  );
}
