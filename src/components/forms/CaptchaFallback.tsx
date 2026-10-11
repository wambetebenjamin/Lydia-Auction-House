'use client';

/**
 * reCAPTCHA v2 checkbox fallback.
 *
 * Presented when the server answers `428 challenge_required`, which it does
 * whenever the v3 score falls below `RECAPTCHA_SCORE_THRESHOLD` (default 0.5).
 * The v3 token and the v2 token are interchangeable at the server, so the same
 * endpoint accepts either.
 *
 * If no v2 site key is configured, the component explains the situation and
 * offers WhatsApp as an alternative route, rather than presenting a dead
 * challenge the visitor cannot complete.
 */

import { useEffect, useRef, useState } from 'react';
import { site } from '@/lib/site';

interface CaptchaFallbackProps {
  onToken: (token: string) => void;
  className?: string;
}

declare global {
  interface Window {
    lahRecaptchaV2Callback?: (token: string) => void;
  }
}

export function CaptchaFallback({ onToken, className = '' }: CaptchaFallbackProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY ?? '';
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    siteKey ? 'loading' : 'error',
  );

  useEffect(() => {
    if (!siteKey) return;
    const host = hostRef.current;
    if (!host) return;

    window.lahRecaptchaV2Callback = (token: string) => {
      setStatus('ready');
      onToken(token);
    };

    // `explicit` render mode so the widget is placed exactly here.
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=lahRecaptchaV2Render&render=explicit';
    script.async = true;
    script.defer = true;

    (window as unknown as Record<string, unknown>).lahRecaptchaV2Render = () => {
      const grecaptcha = (
        window as unknown as {
          grecaptcha?: {
            render: (
              element: HTMLElement,
              options: Record<string, unknown>,
            ) => number;
          };
        }
      ).grecaptcha;
      if (!grecaptcha) {
        setStatus('error');
        return;
      }
      grecaptcha.render(host, {
        sitekey: siteKey,
        callback: 'lahRecaptchaV2Callback',
        theme: 'light',
      });
      setStatus('ready');
    };

    script.onerror = () => setStatus('error');
    document.head.appendChild(script);

    return () => {
      delete window.lahRecaptchaV2Callback;
      script.remove();
    };
  }, [siteKey, onToken]);

  return (
    <div
      className={`rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface-raised)] p-4 ${className}`}
      role="group"
      aria-label="Verification challenge"
    >
      <p className="text-[var(--text-meta)] font-semibold text-[var(--ink)]">
        One more check
      </p>

      {siteKey ? (
        <>
          <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
            We need to confirm you are a person before accepting this action.
          </p>
          <div ref={hostRef} className="mt-3 min-h-[78px]" />
          {status === 'loading' ? (
            <p className="mt-2 text-[11px] text-[var(--ink-subtle)]" aria-live="polite">
              Loading the verification challenge…
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
            Our verification service is not reachable from this connection. You can still reach the
            house directly and we will complete the action for you.
          </p>
          <a
            href={site.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pill-btn pill-btn--secondary mt-3 w-full"
          >
            Continue on WhatsApp
          </a>
          <a
            href={`mailto:${site.email}`}
            className="mt-2 inline-flex min-h-11 items-center text-[var(--text-meta)] underline decoration-2 underline-offset-2"
          >
            Or email {site.email}
          </a>
        </>
      )}

      {status === 'error' && siteKey ? (
        <p role="alert" className="mt-2 text-[var(--text-meta)] text-[var(--status-danger)]">
          The challenge could not load.{' '}
          <a
            href={site.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-2 underline-offset-2"
          >
            Message us on WhatsApp
          </a>{' '}
          and we will handle it directly.
        </p>
      ) : null}
    </div>
  );
}
