'use client';

/** Footer live line: the auction currently running, with a running clock. */
import Link from 'next/link';
import { Countdown } from './Countdown';

export function TickerLine({ target, title }: { target: string; title: string }) {
  return (
    <div className="mt-12 flex flex-col gap-3 border-t border-[var(--line-ink)] pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[family-name:var(--font-condensed)] text-[var(--text-meta)] uppercase tracking-[0.14em] text-white/55">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--status-live)] opacity-70 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--status-live)]" />
        </span>
        <span>In the saleroom now — {title}</span>
      </p>
      <p className="font-[family-name:var(--font-condensed)] text-[var(--text-meta)] uppercase tracking-[0.14em] text-[var(--primary)]">
        Closing in <Countdown target={target} className="font-bold" />
        <Link
          href="/live-auctions"
          className="ml-3 inline-flex min-h-11 items-center underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          Enter the saleroom
        </Link>
      </p>
    </div>
  );
}
