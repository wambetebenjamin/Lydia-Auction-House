/**
 * Route-level loading UI.
 *
 * Next.js shows this while a server component segment is streaming. It mirrors
 * the full-page loading screen's visual language — the design source's yellow
 * stroke on ink — so the hand-off between the two is invisible.
 *
 * `role="status"` and an `aria-busy` region, per the brief's requirement that
 * loading states be announced rather than silent.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading page"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-5 py-24"
    >
      <svg
        viewBox="0 0 240 24"
        aria-hidden="true"
        className="h-6 w-[min(240px,60vw)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lah-route-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFE468" />
            <stop offset="100%" stopColor="#8CC641" />
          </linearGradient>
          <clipPath id="lah-route-clip">
            <rect x="0" y="0" width="240" height="24">
              <animate
                attributeName="width"
                values="0;240"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </rect>
          </clipPath>
        </defs>
        <rect width="240" height="24" rx="12" fill="#F2F2F2" />
        <rect
          width="240"
          height="24"
          rx="12"
          fill="url(#lah-route-stroke)"
          clipPath="url(#lah-route-clip)"
        />
      </svg>

      <p className="font-[family-name:var(--font-condensed)] text-[var(--text-meta)] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        Loading
      </p>
    </div>
  );
}
