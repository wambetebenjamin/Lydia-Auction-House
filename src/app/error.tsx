'use client';

/**
 * 500 — route-level error boundary.
 *
 * The brief specifies the copy: "Something went wrong in the auction room. We
 * are fixing it." with a Try Again control and a WhatsApp route out. It is a
 * client component by necessity (Next requires `reset`), and it is written so
 * that a bidder whose live room has just failed still has somewhere to go.
 */

import { useEffect } from 'react';
import Link from 'next/link';

import { site } from '@/lib/site';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Never surface a stack trace to a bidder, but do leave a breadcrumb.
    console.error('[lah] route error', error.digest ?? '', error.message);
  }, [error]);

  return (
    <div className="shell py-16 md:py-20">
      <div className="mx-auto max-w-[64ch] text-center">
        <p className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.24em] text-[var(--status-danger)]">
          Error 500
        </p>

        <span
          aria-hidden="true"
          className="mx-auto mt-7 grid h-20 w-20 rotate-[-45deg] place-items-center bg-[var(--status-danger)]"
        >
          <span className="rotate-45 font-[family-name:var(--font-display)] text-[1.75rem] font-semibold text-white">
            !
          </span>
        </span>

        <h1
          role="alert"
          className="mt-8 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight"
        >
          Something went wrong in the auction room.
          <span className="mt-1 block text-[var(--ink-muted)]">We are fixing it.</span>
        </h1>

        <p className="mt-5 text-[var(--text-lead)] leading-relaxed text-[var(--ink-muted)]">
          Your bid may or may not have been recorded — the saleroom is the authority on that, and no
          lot closes because a page failed to load. Try again, and if it keeps happening, message the
          house and we will take your bid by hand.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="pill-btn pill-btn--dark">
            Try Again
          </button>
          <a
            href={site.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pill-btn pill-btn--secondary"
          >
            WhatsApp the house
          </a>
          <Link href="/" className="pill-btn pill-btn--ghost">
            Back to the home page
          </Link>
        </div>

        <dl className="mx-auto mt-10 grid max-w-[52ch] gap-5 border-t border-[var(--line)] pt-6 text-left sm:grid-cols-2">
          <div>
            <dt className="meta">Registering a bid now?</dt>
            <dd className="mt-1 text-[var(--text-meta)] leading-relaxed text-[var(--ink-muted)]">
              Telephone{' '}
              <a
                href={`tel:${site.phone.replace(/\s/g, '')}`}
                className="underline decoration-2 underline-offset-2"
              >
                {site.phone}
              </a>{' '}
              and quote the lot number. We will record it in the saleroom.
            </dd>
          </div>
          <div>
            <dt className="meta">If you have already bid</dt>
            <dd className="mt-1 text-[var(--text-meta)] leading-relaxed text-[var(--ink-muted)]">
              Your bid is stored server-side the moment it is accepted, so reloading this page will
              show the current state of the lot rather than lose it.
            </dd>
          </div>
        </dl>

        {error.digest ? (
          <p className="mt-8 text-[11px] text-[var(--ink-subtle)]">
            Reference for our engineers:{' '}
            <span className="font-[family-name:var(--font-mono)]">{error.digest}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
