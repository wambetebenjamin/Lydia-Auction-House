'use client';

/**
 * Floating WhatsApp button — fixed bottom right.
 *
 * Colours come from the design source: the bubble is `--secondary` (#8CC641,
 * verbatim from style.css) with `--dark` (#272630) content, which is the
 * pairing the source itself uses for `.btn-secondary` in its dark navbar.
 * White on #8CC641 measures 2.1:1 and would fail WCAG AA, so the source's own
 * dark-on-green convention is followed instead.
 *
 * Tooltip: "Ask about a lot or arrange a private viewing"
 */

import { useEffect, useState } from 'react';
import { site } from '@/lib/site';

export function WhatsAppButton() {
  const [hintVisible, setHintVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* One-time nudge after the visitor has had a look around. */
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem('lah:wa-hint-seen')) return;
    } catch {
      /* storage blocked — show it anyway, it is non-essential */
    }
    const id = window.setTimeout(() => setHintVisible(true), 6000);
    return () => window.clearTimeout(id);
  }, []);

  const dismissHint = () => {
    setHintVisible(false);
    setDismissed(true);
    try {
      window.sessionStorage.setItem('lah:wa-hint-seen', '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-[80] flex flex-col items-end gap-3 print:hidden">
      {/* Tooltip */}
      {hintVisible ? (
        <div
          role="status"
          className="max-w-[15rem] rounded-[var(--radius-md)] bg-[var(--surface-ink)] px-3.5 py-2.5 text-[var(--text-meta)] leading-snug text-white shadow-[var(--shadow-lg)]"
        >
          <button
            type="button"
            onClick={dismissHint}
            aria-label="Dismiss WhatsApp tip"
            className="float-right -mr-1 -mt-1 ml-2 grid h-6 w-6 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--primary)]"
          >
            <span aria-hidden="true">&times;</span>
          </button>
          {site.whatsappTooltip}
        </div>
      ) : null}

      <a
        href={site.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => !dismissed && setHintVisible(true)}
        onFocus={() => !dismissed && setHintVisible(true)}
        onBlur={() => setHintVisible(false)}
        aria-label="Chat with Lydia Auction House on WhatsApp — ask about a lot or arrange a private viewing"
        className="group grid h-14 w-14 place-items-center rounded-full bg-[var(--secondary)] text-[var(--dark)] shadow-[var(--shadow-lg)] transition-transform duration-[220ms] ease-[var(--ease-spring)] hover:scale-105 active:scale-95 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--dark)] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-7 w-7 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.24 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.44.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29Z" />
        </svg>
        <span className="sr-only">Chat on WhatsApp</span>
      </a>
    </div>
  );
}
