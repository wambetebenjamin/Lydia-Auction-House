/**
 * Skip link. Invisible until focused, and the first thing in the tab order —
 * which matters here because the sticky nav carries a countdown and seven
 * links before the content begins.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only-focusable fixed left-4 top-4 z-[110] rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-3 font-[family-name:var(--font-condensed)] text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--dark)] shadow-[var(--shadow-lg)] focus:outline-3 focus:outline-offset-3 focus:outline-[var(--dark)]"
    >
      Skip to main content
    </a>
  );
}
