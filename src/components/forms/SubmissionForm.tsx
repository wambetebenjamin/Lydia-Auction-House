'use client';

/**
 * Sell with Us — consignment submission form.
 *
 * Collects name, email, phone, artwork type, estimated value range, up to three
 * photographs and a description; uploads the photographs to Vercel Blob through
 * `/api/submission`; protected by reCAPTCHA v3 (action `artist_submission`).
 *
 * The option sets are fetched from the API's own `GET` handler, so the form and
 * the server validator can never drift apart. Until that fetch resolves, the
 * built-in defaults are used, so the form is operable immediately.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { CAPTCHA_ACTIONS, getCaptchaToken } from '@/lib/captcha-client';
import { CaptchaFallback } from './CaptchaFallback';
import { site } from '@/lib/site';

const DEFAULT_TYPES = [
  'Painting',
  'Sculpture',
  'Photography',
  'Jewellery',
  'Textile',
  'Ceramic',
  'Collector edition',
  'Cultural artefact',
  'Mixed / other',
];

const DEFAULT_RANGES = [
  'Under KES 50,000',
  'KES 50,000 – 200,000',
  'KES 200,000 – 500,000',
  'KES 500,000 – 1,000,000',
  'KES 1,000,000 – 3,000,000',
  'Above KES 3,000,000',
];

const MAX_PHOTOS = 3;
const MAX_BYTES = 8 * 1024 * 1024;

interface SubmissionFormProps {
  className?: string;
}

export function SubmissionForm({ className = '' }: SubmissionFormProps) {
  const [types, setTypes] = useState(DEFAULT_TYPES);
  const [ranges, setRanges] = useState(DEFAULT_RANGES);

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [needsV2, setNeedsV2] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  /* Keep the option sets in step with the server. */
  useEffect(() => {
    let cancelled = false;
    fetch('/api/submission')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.ok) return;
        if (Array.isArray(payload.artworkTypes)) setTypes(payload.artworkTypes);
        if (Array.isArray(payload.estimateRanges)) setRanges(payload.estimateRanges);
      })
      .catch(() => {
        /* defaults already in place */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onFiles(selected: FileList | null) {
    setFileError('');
    if (!selected) return;
    const next = Array.from(selected).slice(0, MAX_PHOTOS);
    for (const file of next) {
      if (file.size > MAX_BYTES) {
        setFileError(`${file.name} is larger than 8 MB. Please compress it and try again.`);
        return;
      }
    }
    setFiles(next);
  }

  async function collectAndSend(captchaToken: string) {
    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    data.delete('photos');
    files.forEach((file) => data.append('photos', file));
    data.set('captchaToken', captchaToken);

    const response = await fetch('/api/submission', { method: 'POST', body: data });
    const result = (await response.json()) as {
      ok: boolean;
      reference?: string;
      message?: string;
      errors?: Record<string, string>;
      fallback?: string;
    };

    if (result.ok) {
      setState('done');
      setReference(result.reference ?? '');
      setMessage(result.message ?? 'Received.');
      form.reset();
      setFiles([]);
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
    setMessage(result.message ?? 'We could not send that submission.');
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setErrors({});
    setMessage('');

    try {
      const token = await getCaptchaToken(CAPTCHA_ACTIONS.submission);
      await collectAndSend(token);
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
        <p className="eyebrow text-[#3F5C18]">Submission received</p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
          Thank you — it is with our specialists.
        </h3>
        <p className="mt-3 max-w-[54ch] text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
          {message} We will write to you at the address you gave us. If you would rather talk it
          through sooner, message the house directly.
        </p>
        {reference ? (
          <p className="mt-3 text-[var(--text-meta)] text-[var(--ink-muted)]">
            Your reference is{' '}
            <strong className="font-[family-name:var(--font-mono)] text-[var(--ink)]">
              {reference}
            </strong>
            . Quote it in any correspondence and we will find your submission immediately.
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={site.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pill-btn pill-btn--secondary"
          >
            Message the house
          </a>
          <button
            type="button"
            onClick={() => {
              setState('idle');
              setMessage('');
              setReference('');
            }}
            className="pill-btn pill-btn--ghost"
          >
            Submit another work
          </button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className={className} noValidate>
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

        <Field
          id={`${uid}-phone`}
          label="Phone"
          hint="Include the country code."
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

        <Field id={`${uid}-type`} label="Artwork type" error={errors.artworkType} required>
          <select
            id={`${uid}-type`}
            name="artworkType"
            required
            defaultValue=""
            aria-invalid={Boolean(errors.artworkType) || undefined}
            className={inputClass(Boolean(errors.artworkType))}
          >
            <option value="" disabled>
              Choose a type…
            </option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field
            id={`${uid}-range`}
            label="Estimated value range"
            hint="Your own view is fine — we will give you ours either way."
            error={errors.estimateRange}
            required
          >
            <select
              id={`${uid}-range`}
              name="estimateRange"
              required
              defaultValue=""
              aria-invalid={Boolean(errors.estimateRange) || undefined}
              className={inputClass(Boolean(errors.estimateRange))}
            >
              <option value="" disabled>
                Choose a range…
              </option>
              {ranges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* ── Photographs ─────────────────────────────────────────────────── */}
      <div className="mt-6">
        <label htmlFor={`${uid}-photos`} className="meta mb-2 block">
          Photographs (up to three)
        </label>
        <input
          ref={fileInputRef}
          id={`${uid}-photos`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(event) => onFiles(event.target.files)}
          aria-describedby={`${uid}-photos-hint`}
          aria-invalid={Boolean(fileError) || undefined}
          className="block w-full cursor-pointer rounded-[var(--radius-md)] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] px-3 py-3 text-[var(--text-meta)] file:mr-3 file:min-h-11 file:rounded-[var(--radius-pill)] file:border-0 file:bg-[var(--dark)] file:px-4 file:font-[family-name:var(--font-condensed)] file:text-[11px] file:uppercase file:tracking-[0.1em] file:text-[var(--primary)] hover:border-[var(--dark)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)]"
        />
        <p id={`${uid}-photos-hint`} className="mt-2 text-[11px] leading-relaxed text-[var(--ink-subtle)]">
          Front, back and any damage you think we should know about. JPEG, PNG, WebP or AVIF, up to
          8 MB each. Photographs are stored on Vercel Blob and are seen only by our specialists.
        </p>
        {files.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="rounded-[var(--radius-pill)] bg-[var(--light)] px-3 py-1.5 text-[11px] text-[var(--ink-muted)]"
              >
                {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
              </li>
            ))}
          </ul>
        ) : null}
        {fileError ? (
          <p role="alert" className="mt-2 text-[var(--text-meta)] text-[var(--status-danger)]">
            {fileError}
          </p>
        ) : null}
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <div className="mt-6">
        <Field
          id={`${uid}-description`}
          label="Describe the work"
          hint="Title, artist, year, medium, dimensions, and how you came by it. Provenance helps most."
          error={errors.description}
          required
        >
          <textarea
            id={`${uid}-description`}
            name="description"
            rows={6}
            required
            minLength={20}
            aria-invalid={Boolean(errors.description) || undefined}
            className={inputClass(Boolean(errors.description))}
            placeholder="e.g. Untitled, Wanjiru Kamau, 2019. Oil on linen, 120 × 100 cm. Bought from the artist's studio in Nairobi; in the family since."
          />
        </Field>
      </div>

      {needsV2 ? (
        <CaptchaFallback
          className="mt-6"
          onToken={async (token) => {
            setNeedsV2(false);
            setState('sending');
            try {
              await collectAndSend(token);
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
        {state === 'sending' ? 'Sending…' : 'Submit for assessment'}
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
        This form is protected by reCAPTCHA and subject to Google&rsquo;s privacy policy and terms.
        We use your details only to assess the consignment — see our{' '}
        <a href="/legal/privacy-policy" className="underline decoration-2 underline-offset-2">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}

/* ── Shared field primitives ─────────────────────────────────────────────── */

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="meta mb-1.5 block">
        {label}
        {required ? (
          <span className="ml-1 text-[var(--status-live)]" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-subtle)]">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-[11px] text-[var(--status-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function inputClass(invalid: boolean): string {
  return `min-h-12 w-full rounded-[var(--radius-md)] border bg-[var(--surface)] px-3 py-2.5 text-[var(--text-ui)] outline-none transition-colors duration-200 placeholder:text-[var(--ink-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--light)] disabled:opacity-70 ${
    invalid
      ? 'border-[var(--status-danger)] focus:ring-3 focus:ring-[rgba(179,38,30,0.28)]'
      : 'border-[var(--line-strong)] focus:border-[var(--dark)] focus:ring-3 focus:ring-[var(--primary)]/50'
  }`;
}
