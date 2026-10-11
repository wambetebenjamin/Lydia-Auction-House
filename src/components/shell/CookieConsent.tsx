'use client';

/**
 * COOKIE CONSENT BANNER — built to the brief's fallback specification.
 *
 * The design source contained no cookie banner of any kind: `grep -rni "cookie"`
 * across every HTML, CSS and JS file in painter-1.0.0/ returns zero matches
 * (DESIGN-INVENTORY.md §5). So this is the brief's specification, implemented:
 *
 *   • Bottom-fixed, full width.
 *   • The exact required sentence, plus a link to /legal/cookie-policy.
 *   • Accept All and Manage Preferences.
 *   • Modal with four categories: Necessary (locked), Functional, Analytics,
 *     Marketing.
 *   • Persisted to localStorage; never shown again once a choice is recorded.
 *   • Kenya Data Protection Act 2019 compliant: consent is granular, freely
 *     given, recorded with a timestamp and version, and withdrawable at any
 *     time from the footer's "Cookie preferences" control or the policy page.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useFocusTrap, useMounted } from '@/lib/hooks';

export const CONSENT_STORAGE_KEY = 'lah:cookie-consent';
const CONSENT_VERSION = 1;

export interface ConsentCategories {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  version: number;
  at: string;
  categories: ConsentCategories;
}

const DEFAULT_CATEGORIES: ConsentCategories = {
  necessary: true,
  functional: true,
  analytics: true,
  marketing: true,
};

const CATEGORY_COPY: {
  key: keyof ConsentCategories;
  label: string;
  locked?: boolean;
  detail: string;
}[] = [
  {
    key: 'necessary',
    label: 'Necessary',
    locked: true,
    detail:
      'Required for the site to work. These keep your bid session secure, remember that you have already seen this notice, and protect the bid endpoints against automated abuse. They cannot be switched off.',
  },
  {
    key: 'functional',
    label: 'Functional',
    detail:
      'Remember your bid preferences, your watch list, and the lots you have already viewed, so the auction room opens where you left it.',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    detail:
      'Aggregated, non-identifying measurement of which lots and artists are being browsed. This helps us plan the auction calendar. No bidder identity is ever included.',
  },
  {
    key: 'marketing',
    label: 'Marketing',
    detail:
      'Lets us show you upcoming sales and new arrivals on other sites you visit. If you switch this off you will still receive anything you have explicitly subscribed to.',
  },
];

export function readConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null;
    return { ...parsed, categories: { ...DEFAULT_CATEGORIES, ...parsed.categories } };
  } catch {
    return null;
  }
}

function writeConsent(categories: ConsentCategories): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    at: new Date().toISOString(),
    categories,
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    // Mirror onto the document so CSS can gate non-essential behaviour.
    document.documentElement.dataset.consentFunctional = String(categories.functional);
    document.documentElement.dataset.consentAnalytics = String(categories.analytics);
    document.documentElement.dataset.consentMarketing = String(categories.marketing);
    window.dispatchEvent(new CustomEvent('lah:consent', { detail: record }));
  } catch {
    /* storage full or blocked — the banner will simply reappear next visit */
  }
  return record;
}

/**
 * Allows the footer's "Cookie preferences" link to reopen the manager after a
 * choice has already been made — a KDPA requirement (consent must be
 * withdrawable as easily as it was given).
 */
export function openCookiePreferences(): void {
  window.dispatchEvent(new CustomEvent('lah:open-consent'));
}

export function CookieConsent() {
  const mounted = useMounted();
  const [visible, setVisible] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentCategories>(DEFAULT_CATEGORIES);
  const [saved, setSaved] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(managerOpen, dialogRef, bannerRef);

  /* Read any existing decision on mount. */
  useEffect(() => {
    if (!mounted) return;
    const existing = readConsent();
    if (!existing) {
      // A short delay keeps the banner from colliding with the loading screen.
      const id = window.setTimeout(() => setVisible(true), 2200);
      return () => window.clearTimeout(id);
    }
    document.documentElement.dataset.consentFunctional = String(existing.categories.functional);
    document.documentElement.dataset.consentAnalytics = String(existing.categories.analytics);
    document.documentElement.dataset.consentMarketing = String(existing.categories.marketing);
  }, [mounted]);

  /* The footer can reopen the manager at any time. */
  useEffect(() => {
    const handler = () => {
      const existing = readConsent();
      if (existing) setDraft(existing.categories);
      setVisible(true);
      setManagerOpen(true);
    };
    window.addEventListener('lah:open-consent', handler);
    return () => window.removeEventListener('lah:open-consent', handler);
  }, []);

  const commit = useCallback((categories: ConsentCategories, message: string) => {
    const record = writeConsent(categories);
    setSaved(message);
    setManagerOpen(false);
    // Leave a confirmation on screen briefly, then withdraw the banner.
    window.setTimeout(() => setVisible(false), 1400);
    return record;
  }, []);

  const acceptAll = () =>
    commit(
      { necessary: true, functional: true, analytics: true, marketing: true },
      'All cookies accepted.',
    );

  const rejectAll = () =>
    commit(
      { necessary: true, functional: false, analytics: false, marketing: false },
      'Only necessary cookies will be set.',
    );

  const savePreferences = () =>
    commit(
      { ...draft, necessary: true },
      'Your cookie preferences have been saved.',
    );

  /* Escape closes the manager without recording a choice. */
  useEffect(() => {
    if (!managerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setManagerOpen(false);
        bannerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [managerOpen]);

  if (!mounted || !visible) return null;

  const toggle = (key: keyof ConsentCategories) => {
    if (key === 'necessary') return;
    setDraft((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <>
      {/* ── The banner ───────────────────────────────────────────────────── */}
      <div
        ref={bannerRef}
        role="region"
        aria-label="Cookie consent"
        className="fixed inset-x-0 bottom-0 z-[90] border-t border-[var(--line-ink)] bg-[var(--surface-ink)] text-white"
        style={{
          // Keeps the fixed WhatsApp button and mobile bid panel clear of the banner.
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="mx-auto flex w-full max-w-[var(--shell-max)] flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-8 md:px-8 lg:px-10">
          <p
            role={saved ? 'status' : undefined}
            aria-live="polite"
            className="max-w-[68ch] text-[var(--text-body-min)] leading-relaxed text-white/85"
          >
            {saved ? (
              <span className="text-[var(--primary)]">{saved}</span>
            ) : (
              <>
                Lydia Auction House uses cookies to personalise your browsing experience and
                remember your bid preferences. See our{' '}
                <Link
                  href="/legal/cookie-policy"
                  className="text-[var(--primary)] underline decoration-2 underline-offset-2 hover:text-white"
                >
                  Cookie Policy
                </Link>
                .
              </>
            )}
          </p>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="pill-btn pill-btn--ghost min-h-12"
            >
              Manage Preferences
            </button>
            <button type="button" onClick={rejectAll} className="pill-btn pill-btn--ghost min-h-12">
              Essential only
            </button>
            <button type="button" onClick={acceptAll} className="pill-btn pill-btn--primary min-h-12">
              Accept All
            </button>
          </div>
        </div>
      </div>

      {/* ── The preferences modal ────────────────────────────────────────── */}
      {managerOpen ? (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setManagerOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-manager-title"
            aria-describedby="cookie-manager-intro"
            className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-t-[var(--radius-lg)] bg-[var(--surface)] text-[var(--ink)] sm:rounded-[var(--radius-lg)]"
          >
            <header className="border-b border-[var(--line)] px-6 pb-4 pt-6">
              <p className="eyebrow">Cookie preferences</p>
              <h2
                id="cookie-manager-title"
                className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h3)]"
              >
                Manage your choices
              </h2>
              <p
                id="cookie-manager-intro"
                className="mt-2 text-[var(--text-body-min)] text-[var(--ink-muted)]"
              >
                You decide what we may store. Necessary cookies are always on because the auction
                room cannot run without them. Your choice is recorded with the date and can be
                changed at any time.
              </p>
            </header>

            <ul className="divide-y divide-[var(--line)] px-6">
              {CATEGORY_COPY.map(({ key, label, detail, locked }) => (
                <li key={key} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[var(--text-ui)] font-semibold">
                        {label}
                        {locked ? (
                          <span className="rounded-full bg-[var(--light)] px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                            Always on
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1.5 text-[var(--text-meta)] leading-relaxed text-[var(--ink-muted)]">
                        {detail}
                      </p>
                    </div>

                    {/* A real switch: min 48 × 48 touch target. */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={key === 'necessary' ? true : draft[key]}
                      aria-label={`${label} cookies`}
                      disabled={locked}
                      onClick={() => toggle(key)}
                      className={`relative mt-1 h-12 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)] ${
                        locked || draft[key]
                          ? 'bg-[var(--secondary)]'
                          : 'bg-[var(--line-strong)]'
                      } ${locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-[left] duration-200"
                        style={{ left: locked || draft[key] ? 'calc(100% - 26px)' : '6px' }}
                      />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="sticky bottom-0 flex flex-col gap-2 border-t border-[var(--line)] bg-[var(--surface)] px-6 py-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={rejectAll} className="pill-btn pill-btn--ghost">
                Reject non-essential
              </button>
              <button type="button" onClick={savePreferences} className="pill-btn pill-btn--dark">
                Save preferences
              </button>
              <button type="button" onClick={acceptAll} className="pill-btn pill-btn--primary">
                Accept all
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
