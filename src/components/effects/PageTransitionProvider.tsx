'use client';

/**
 * EFFECT-22 — Page transitions.
 *
 * Uses the View Transitions API where the browser implements it, and a plain
 * CSS crossfade underneath (`::view-transition-*` rules live in
 * components.css, with a `@supports`-free progressive enhancement so browsers
 * without the API simply navigate normally).
 *
 * On every completed navigation:
 *   • focus moves to the new page's <h1>, so keyboard and screen-reader users
 *     land at the top of the content rather than at the document root
 *   • a polite live region announces the new page
 *
 * Both behaviours hold under reduced motion — they are orientation aids, not
 * decoration, so the brief's "instant page change" applies to the visual
 * transition only.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      previous.current = pathname;
      return;
    }
    if (previous.current === pathname) return;
    previous.current = pathname;

    // Wait for the new route's DOM to commit.
    const id = window.setTimeout(() => {
      const main = document.getElementById('main');
      const heading =
        main?.querySelector<HTMLElement>('h1') ??
        main?.querySelector<HTMLElement>('[data-page-heading]') ??
        main;

      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        // `preventScroll` then an explicit scroll keeps the sticky nav correct.
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
      }

      const announced = heading?.textContent?.trim() ?? document.title;
      announce(`Navigated to ${announced}`);
    }, 90);

    return () => window.clearTimeout(id);
  }, [pathname]);

  return <>{children}</>;
}

function announce(message: string): void {
  const region = document.getElementById('lah-live-region');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 50);
}
