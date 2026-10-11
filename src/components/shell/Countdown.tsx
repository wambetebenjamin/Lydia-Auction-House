'use client';

/**
 * Live countdown to a lot's close or an auction's start.
 *
 * Hydration-safe: the server renders the target's absolute time, the client
 * swaps in the ticking clock after mount, so there is never a mismatch and
 * never a layout shift (the clock is set in tabular figures at a fixed width).
 */

import { useEffect, useState } from 'react';
import {
  countdown,
  formatCountdownClock,
  formatCountdownVerbose,
  formatDateTime,
  spokenCountdown,
} from '@/lib/format';
import { useNow, usePrefersReducedMotion } from '@/lib/hooks';

interface CountdownProps {
  target: string;
  /** `clock` → 02:14:33 · `verbose` → 2d 02:14:33 · `blocks` → segmented units */
  variant?: 'clock' | 'verbose' | 'blocks';
  className?: string;
  /** Announce the remaining time to assistive tech once a minute. */
  announce?: boolean;
  label?: string;
}

export function Countdown({
  target,
  variant = 'clock',
  className = '',
  announce = false,
  label = 'Time remaining',
}: CountdownProps) {
  const [mounted, setMounted] = useState(false);
  const reduced = usePrefersReducedMotion();
  // Under reduced motion the seconds tick is pointless noise — settle at 1/min.
  const now = useNow(reduced ? 60_000 : 1000);

  useEffect(() => setMounted(true), []);

  const parts = countdown(target, mounted ? now : undefined);
  const closed = parts.elapsed;

  if (!mounted) {
    // Server + first client paint: absolute target time, fixed width, no shift.
    return (
      <time dateTime={target} className={className} suppressHydrationWarning>
        {formatDateTime(target)}
      </time>
    );
  }

  if (variant === 'blocks') {
    const units = [
      { value: parts.days, label: 'Days' },
      { value: parts.hours, label: 'Hours' },
      { value: parts.minutes, label: 'Minutes' },
      { value: parts.seconds, label: 'Seconds' },
    ];
    return (
      <div className={className}>
        <div className="flex gap-2" role="group" aria-label={label}>
          {units.map((unit) => (
            <div
              key={unit.label}
              className="min-w-[3.75rem] rounded-[var(--radius-md)] bg-[var(--surface-ink)] px-2.5 py-2 text-center text-white"
            >
              <span className="block font-[family-name:var(--font-condensed)] text-[1.5rem] font-bold leading-none [font-variant-numeric:tabular-nums]">
                {closed ? '—' : String(unit.value).padStart(2, '0')}
              </span>
              <span className="mt-1 block font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em] text-white/55">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
        <time dateTime={target} className="sr-only">
          {closed ? 'This lot has closed.' : `${label}: ${spokenCountdown(target, now)}.`}
        </time>
      </div>
    );
  }

  const text = closed
    ? 'Closed'
    : variant === 'verbose'
      ? formatCountdownVerbose(target, now)
      : formatCountdownClock(target, now);

  return (
    <>
      <time
        dateTime={target}
        className={`[font-variant-numeric:tabular-nums] ${className}`}
        suppressHydrationWarning
      >
        {text}
      </time>
      {announce ? (
        <span aria-live="polite" className="sr-only">
          {closed ? 'This lot has closed.' : `${label}: ${spokenCountdown(target, now)}.`}
        </span>
      ) : null}
    </>
  );
}

/**
 * The navbar ticker: "Next auction starts in 02:14:33."
 * Rendered as a single sentence so screen readers read it as one statement
 * rather than announcing every changing digit.
 */
export function NavTicker({ target, className = '' }: { target: string; className?: string }) {
  const timeout = process.env.NEXT_PUBLIC_TICKER_TIMEOUT_MS
    ? Number(process.env.NEXT_PUBLIC_TICKER_TIMEOUT_MS)
    : 9000;

  return (
    <p className={className}>
      <span>Next auction starts in </span>
      <Countdown target={target} variant="clock" className="font-semibold" />
      <span>.</span>
      <span aria-hidden="true" className="sr-only">
        {' '}
      </span>
      <span className="sr-only" data-ticker-timeout={timeout} />
    </p>
  );
}
