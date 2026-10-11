'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** SSR-safe media query hook. Always false on the server. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * `prefers-reduced-motion: reduce`. Every effect in the brief is gated on this.
 * Starts `false` so the server and first client render agree, then corrects.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** True once the component has mounted on the client. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** True only on devices with a genuine hover-capable pointer (EFFECT-26 gate). */
export function useHoverCapable(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}

/** Calls `onChange` once the window has scrolled past `threshold` (EFFECT-28). */
export function useScrolledPast(threshold: number): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setPast(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return past;
}

/** Locks body scroll while a modal or drawer is open. Returns the previous value. */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [locked]);
}

/**
 * Traps Tab focus inside `ref` while `active`. Focus is moved to the first
 * focusable descendant on activation and returned to `restoreTo` on release.
 */
export function useFocusTrap(
  active: boolean,
  ref: React.RefObject<HTMLElement | null>,
  restoreTo?: React.RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const restore = restoreTo?.current ?? (document.activeElement as HTMLElement | null);

    const focusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    const first = focusable()[0];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      restore?.focus?.();
    };
  }, [active, ref, restoreTo]);
}

/** Ticking clock, paused when `paused`. Drives every countdown in the UI. */
export function useNow(intervalMs = 1000, paused = false): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (paused) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, paused]);

  return now;
}

/**
 * Fires `onReveal` the first time the element enters the viewport.
 * Used to defer mounting expensive children — the 3D lot render, flipbook pages.
 */
export function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = { rootMargin: '200px' },
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
          return;
        }
      }
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

/** Stable anonymous id for this browsing session — used only for bidder counting. */
export function useSessionId(): string {
  const [id, setId] = useState('');

  useEffect(() => {
    const KEY = 'lah:session-id';
    let existing = '';
    try {
      existing = window.localStorage.getItem(KEY) ?? '';
    } catch {
      /* storage blocked — fall through to an ephemeral id */
    }
    if (!existing) {
      existing =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `s-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      try {
        window.localStorage.setItem(KEY, existing);
      } catch {
        /* ignore */
      }
    }
    setId(existing);
  }, []);

  return id;
}

/** Announcement string pushed to a polite live region. */
export function useLiveRegion(): [string, (message: string) => void] {
  const [message, setMessage] = useState('');
  const announce = useCallback((next: string) => {
    // Re-announce identical strings by clearing first.
    setMessage('');
    window.setTimeout(() => setMessage(next), 60);
  }, []);
  return [message, announce];
}

/** Applies the View Transitions API where available (EFFECT-22). */
export function useViewTransition(): (callback: () => void, label?: string) => void {
  return useCallback((callback: () => void, label = 'Page transition') => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof doc.startViewTransition !== 'function' || reduced) {
      callback();
      return;
    }
    doc.startViewTransition(callback);
    void label;
  }, []);
}

/** Intersection-driven stagger orchestration for sequenced entrances (EFFECT-23). */
export function useStaggeredReveal(
  count: number,
  { startDelay = 0, step = 90, enabled = true }: { startDelay?: number; step?: number; enabled?: boolean } = {},
): { revealed: boolean; delayFor: (index: number) => number } {
  const [revealed, setRevealed] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setTimeout(() => setRevealed(true), startDelay);
    return () => window.clearTimeout(id);
  }, [enabled, startDelay]);

  const delayFor = useCallback((index: number) => index * step, [step]);

  return useMemo(() => ({ revealed, delayFor }), [revealed, delayFor, count]);
}
