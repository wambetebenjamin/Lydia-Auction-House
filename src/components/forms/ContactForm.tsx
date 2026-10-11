'use client';

/**
 * Private sale enquiry form — delivered by Nodemailer via `/api/contact`,
 * protected by reCAPTCHA v3 (action `contact_enquiry`).
 *
 * Accepts an optional `lot` so a lot page can pre-fill the enquiry, and an
 * `interest` select so the house can route the message correctly.
 */

import { useId, useRef, useState } from 'react';
import { CAPTCHA_ACTIONS, getCaptchaToken } from '@/lib/captcha-client';
import { CaptchaFallback } from './CaptchaFallback';
import { Field, inputClass } from './SubmissionForm';
import { site } from '@/lib/site';

const INTERESTS = ['Buying', 'Selling', 'Private viewing', 'Consignment', 'Press', 'Other'];

interface ContactFormProps {
  lot?: string;
  defaultInterest?: string;
  className?: string;
}

export function ContactForm({ lot, defaultInterest = 'Buying', className = '' }: ContactFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [needsV2, setNeedsV2] = useState(false);

  const uid = useId();
  /** Held so the v2 fallback can resend the same message. */
  const pending = useRef<Record<string, string> | null>(null);

  async function send(payload: Record<string, string>, captchaToken: string) {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, lot, captchaToken }),
    });
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      errors?: Record<string, string>;
      fallback?: string;
    };

    if (result.ok) {
      setState('done');
      setMessage(result.message ?? 'Thank you — your enquiry is with the house.');
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
    setMessage(result.message ?? 'We could not send that message.');
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, string> = {};
    for (const [key, value] of data.entries()) payload[key] = String(value);

    pending.current = payload;
    setState('sending');
    setErrors({});
    setMessage('');

    try {
      const token = await getCaptchaToken(CAPTCHA_ACTIONS.contact);
      await send(payload, token);
    } catch {
      setState('error');
      setMessage('Network error. Please try again, or message us on WhatsApp.');
    }
  }

  if (state === 'done') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-[var(--radius-lg)] border-2 border-[var(--secondary)] bg-[rgba(140,198,65,0.1)] p-8 ${className}`}
      >
        <p className="eyebrow text-[#3F5C18]">Message sent</p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
          Thank you — we have your enquiry.
        </h3>
        <p className="mt-3 max-w-[54ch] text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
          {message} We reply to every message within one working day.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={site.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pill-btn pill-btn--secondary"
          >
            WhatsApp the house
          </a>
          <button
            type="button"
            onClick={() => {
              setState('idle');
              setMessage('');
            }}
            className="pill-btn pill-btn--ghost"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${uid}-name`} label="Your name" error={errors.name} required>
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

        <Field id={`${uid}-phone`} label="Phone" hint="Optional, but quicker." error={errors.phone}>
          <input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass(false)}
          />
        </Field>

        <Field id={`${uid}-interest`} label="What is this about?" error={errors.interest} required>
          <select
            id={`${uid}-interest`}
            name="interest"
            required
            defaultValue={defaultInterest}
            className={inputClass(Boolean(errors.interest))}
          >
            {INTERESTS.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field
            id={`${uid}-subject`}
            label="Subject"
            hint={lot ? `Referring to lot: ${lot}` : 'Optional — we will infer it from your message.'}
          >
            <input
              id={`${uid}-subject`}
              name="subject"
              type="text"
              defaultValue={lot ? `Enquiry about ${lot}` : ''}
              className={inputClass(false)}
            />
          </Field>
        </div>
      </div>

      <div className="mt-5">
        <Field id={`${uid}-message`} label="Your message" error={errors.message} required>
          <textarea
            id={`${uid}-message`}
            name="message"
            rows={6}
            required
            minLength={10}
            aria-invalid={Boolean(errors.message) || undefined}
            className={inputClass(Boolean(errors.message))}
            placeholder="Tell us what you are looking for, or what you would like to know about a lot."
          />
        </Field>
      </div>

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
              await send(pending.current, token);
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
        {state === 'sending' ? 'Sending…' : 'Send enquiry'}
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
        Protected by reCAPTCHA. Your message goes straight to the house inbox at {site.email} and is
        not shared with anyone outside it.
      </p>
    </form>
  );
}
