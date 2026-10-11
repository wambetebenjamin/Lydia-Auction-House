'use client';

/**
 * Sticky navigation — EFFECT-28 (glassmorphic on scroll) plus the brief's
 * structure: logo left, seven centre links, Register to Bid CTA and Sign In on
 * the right, and a countdown ticker for the next live auction.
 *
 * Carried over from the design source, unchanged:
 *   • dark bar in `--dark` (#272630)
 *   • wordmark rendered as a first-level heading, not decoration
 *   • the nav block closed by a 5px `--primary` right border (source:
 *     `border-end border-5 border-primary`)
 *   • the yellow underline that grows from the centre to 100% on hover/active
 *     (source: `.navbar-dark .navbar-nav .nav-link::before`), now at the
 *     brief's 13px navigation size instead of the source's 18px
 *
 * EFFECT-28 specifics: blur capped at 20px, a solid fallback whenever the
 * backdrop-filter is unsupported, and focus rings that stay visible over blur.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { site } from '@/lib/site';
import { liveAuction } from '@/data/auctions';
import { formatDate, formatTime } from '@/lib/format';
import { useFocusTrap, useScrolledPast, useScrollLock } from '@/lib/hooks';
import { Countdown, NavTicker } from './Countdown';

export function SiteHeader() {
  const pathname = usePathname();
  const glass = useScrolledPast(Number(process.env.NEXT_PUBLIC_GLASS_THRESHOLD ?? 40));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [drawerPointerDown, setDrawerPointerDown] = useState(false);

  useScrollLock(drawerOpen);
  useFocusTrap(drawerOpen, drawerRef, triggerRef);

  /* Close the drawer on navigation and on Escape. */
  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const isActive = useCallback(
    (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href)),
    [pathname],
  );

  const glassOn = glass && !drawerOpen;

  return (
    <header
      className="sticky top-0 z-[70]"
      data-glass={glassOn ? 'true' : 'false'}
      style={{
        // EFFECT-28. `backdrop-filter` with the brief's 20px cap.
        backdropFilter: glassOn ? 'blur(var(--glass-blur)) saturate(150%)' : 'none',
        WebkitBackdropFilter: glassOn ? 'blur(var(--glass-blur)) saturate(150%)' : 'none',
        backgroundColor: glassOn ? 'var(--surface-glass)' : 'var(--surface-ink)',
        boxShadow: glassOn ? 'var(--shadow-glass)' : 'none',
        transition: 'background-color 260ms var(--ease-out), box-shadow 260ms var(--ease-out)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Solid fallback: browsers without backdrop-filter get an opaque bar. */}
      <style>{`
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          header[data-glass="true"] { background-color: var(--surface-ink-sunken) !important; }
        }
      `}</style>

      {/* ── Countdown ticker ─────────────────────────────────────────────── */}
      <div className="border-b border-[var(--line-ink)] bg-[var(--surface-ink-sunken)]">
        <div className="mx-auto flex w-full max-w-[var(--shell-max)] items-center justify-between gap-4 px-5 md:px-8 lg:px-10">
          <NavTicker
            target={liveAuction.endsAt}
            className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-[var(--primary)] md:text-[var(--text-meta)]"
          />
          <p className="hidden shrink-0 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/55 md:block">
            {liveAuction.venue} · {formatDate(liveAuction.endsAt, { day: 'numeric', month: 'short' })}
            , {formatTime(liveAuction.endsAt)}
          </p>
        </div>
      </div>

      {/* ── Main bar ─────────────────────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[var(--shell-max)] items-center gap-4 px-5 md:px-8 lg:px-10">
        {/* Wordmark. Still an <h1> on the home page only; a <p> elsewhere so
            each page keeps exactly one first-level heading. */}
        <Link
          href="/"
          aria-label={`${site.name} — home`}
          className="flex shrink-0 items-center gap-3 py-3 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
        >
          <BrushMark />
          <span className="leading-none">
            <span className="block font-[family-name:var(--font-condensed)] text-[10px] uppercase tracking-[0.26em] text-[var(--primary)]/80">
              Nairobi · Est. 2009
            </span>
            <span className="mt-1 block font-[family-name:var(--font-display)] text-[1.0625rem] font-semibold tracking-[0.01em] text-white sm:text-[1.1875rem]">
              Lydia Auction House
            </span>
          </span>
        </Link>

        {/* Centre links — with the source's 5px yellow right border preserved. */}
        <nav
          aria-label="Primary"
          className="ml-auto hidden xl:block"
        >
          <ul className="flex items-center gap-1 border-r-[5px] border-[var(--primary)] pr-4">
            {site.nav.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`nav-link group relative block px-3 py-6 font-[family-name:var(--font-condensed)] text-[13px] uppercase tracking-[var(--tracking-nav)] transition-colors duration-[220ms] focus-visible:outline-3 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--primary)] ${
                      active ? 'text-[var(--primary)]' : 'text-white/82 hover:text-[var(--primary)]'
                    }`}
                  >
                    {item.label}
                    {/* Source motif: underline grows from the centre outward. */}
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-1/2 h-[5px] bg-[var(--primary)] transition-all duration-500 ease-[var(--ease-out)] group-hover:left-0 group-hover:w-full group-focus-visible:left-0 group-focus-visible:w-full motion-reduce:transition-none ${
                        active ? 'left-0 w-full' : 'w-0'
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right cluster */}
        <div className={`hidden items-center gap-3 xl:flex ${'ml-auto'}`}>
          <Link
            href="/register"
            className="pill-btn pill-btn--primary min-h-11 whitespace-nowrap"
          >
            Register to Bid
          </Link>
          <Link
            href="/register?mode=signin"
            className="font-[family-name:var(--font-condensed)] text-[13px] uppercase tracking-[var(--tracking-nav)] text-white/75 underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--primary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            Sign In
          </Link>
        </div>

        {/* Compact ticker for mid-size screens */}
        <p className="ml-auto hidden font-[family-name:var(--font-condensed)] text-[12px] uppercase tracking-[0.12em] text-[var(--primary)] lg:block xl:hidden">
          Closes in <Countdown target={liveAuction.endsAt} className="font-bold" />
        </p>

        {/* Hamburger — 48 × 48 minimum */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setDrawerOpen((open) => !open)}
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          className="ml-auto grid h-12 w-12 shrink-0 place-items-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] xl:hidden"
        >
          <span aria-hidden="true" className="relative block h-4 w-6">
            <span
              className="absolute left-0 block h-[2px] w-full bg-current transition-all duration-[220ms]"
              style={{ top: drawerOpen ? '50%' : '0', transform: drawerOpen ? 'rotate(45deg)' : 'none' }}
            />
            <span
              className="absolute left-0 top-1/2 block h-[2px] w-full -translate-y-1/2 bg-current transition-opacity duration-[220ms]"
              style={{ opacity: drawerOpen ? 0 : 1 }}
            />
            <span
              className="absolute left-0 block h-[2px] w-full bg-current transition-all duration-[220ms]"
              style={{
                bottom: drawerOpen ? '50%' : '0',
                transform: drawerOpen ? 'translateY(50%) rotate(-45deg)' : 'none',
              }}
            />
          </span>
        </button>
      </div>

      {/* ── Mobile overlay drawer ────────────────────────────────────────── */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 top-0 z-[60] bg-black/50 xl:hidden"
          onMouseDown={() => setDrawerPointerDown(true)}
          onMouseUp={() => {
            if (drawerPointerDown) setDrawerOpen(false);
            setDrawerPointerDown(false);
          }}
        >
          <div
            ref={drawerRef}
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="ml-auto h-full w-[min(22rem,88vw)] overflow-y-auto bg-[var(--surface-ink)] pb-10"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[var(--line-ink)] px-6 py-5">
              <p className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.2em] text-[var(--primary)]">
                Next auction starts in
              </p>
              <Countdown
                target={liveAuction.endsAt}
                variant="clock"
                className="mt-1 block font-[family-name:var(--font-display)] text-[1.75rem] text-white"
              />
              <p className="mt-1 text-[var(--text-meta)] text-white/55">
                {liveAuction.title} · {liveAuction.lotsCount} lots
              </p>
            </div>

            <nav aria-label="Mobile">
              <ul className="divide-y divide-[var(--line-ink)]">
                {site.nav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`flex min-h-[52px] items-center justify-between px-6 font-[family-name:var(--font-condensed)] text-[15px] uppercase tracking-[0.06em] transition-colors focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--primary)] ${
                          active ? 'bg-white/6 text-[var(--primary)]' : 'text-white/85 hover:bg-white/5'
                        }`}
                      >
                        {item.label}
                        <span aria-hidden="true" className="text-[var(--secondary)]">
                          &rarr;
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex flex-col gap-3 px-6 py-6">
              <Link href="/register" className="pill-btn pill-btn--primary min-h-12 w-full">
                Register to Bid
              </Link>
              <Link
                href="/register?mode=signin"
                className="pill-btn pill-btn--ghost-invert min-h-12 w-full"
              >
                Sign In
              </Link>
            </div>

            <div className="border-t border-[var(--line-ink)] px-6 py-5 text-[var(--text-meta)] text-white/60">
              <p>{site.addressLines.join(', ')}</p>
              <p className="mt-2">
                <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="hover:text-[var(--primary)]">
                  {site.phone}
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

/** The house's brush mark, drawn from the design source's own stroke colours. */
function BrushMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="h-9 w-9 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="6" fill="#FFE468" />
      <path
        d="M9 27c4-6 8-3 11-8s5-8 9-6"
        stroke="#272630"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="29" cy="27" r="3.2" fill="#8CC641" />
    </svg>
  );
}
