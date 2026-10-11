# Extensions and substitutions

The brief says *clone the uploaded zip exactly, then build on top — never redesign
what exists*. This document is the honest register of where that was not literally
possible, or where a dependency named in the brief could not be used as named.

Everything in the left-hand column **exists in the zip** and is reproduced. The
right-hand column is what this build does instead, and why.

## 1. Vendored Bootstrap → Tailwind v4 over the source's own tokens

* **In the zip:** `css/bootstrap.min.css` (Bootstrap **5.0.0**), plus `css/style.css`
  carrying the template's four custom properties and its Bootstrap overrides.
* **Here:** no Bootstrap stylesheet is shipped. `src/styles/tokens.css` reproduces
  `:root { --primary: #FFE468; --secondary: #8CC641; --light: #F2F2F2; --dark: #272630; }`
  and the `--bs-*` overrides verbatim, and `src/app/globals.css` maps them into
  Tailwind v4's `@theme inline` so the four source values remain the single source
  of truth.
* **Why:** the brief specifies Next.js + React; Bootstrap's jQuery-free CSS would
  have to be supplemented anyway for the 30 effects, and shipping two design
  systems would mean two sets of spacing, radius and breakpoint decisions. The
  *look* is preserved — the utility names in the markup map to the same values
  (`rounded-pill`, `px-md-5`, `bg-primary`, `shadow-sm`).
* **Fidelity check:** every component the source uses is reproduced with its
  measured geometry. Navbar `px-5` with the `border-5` yellow end rule; the hero's
  `container-fluid bg-primary py-5`; 55px inputs; the 45° diamond overhang at
  `-50px`; the card CTA rising from `bottom: -30px` to `0`; `service-item`'s
  `background-position` hover over 5 s; `.5s` transitions; the `.btn:hover` shadow
  `0 8px 6px -6px #555`.

## 2. Font Awesome / Bootstrap Icons → inline SVG

* **In the zip:** the template loads an icon font and uses `<i class="fa fa-…">`.
* **Here:** every icon is an inline `<svg>` with `aria-hidden="true"` and a
  neighbouring text label, or a `currentColor`-driven shape.
* **Why:** an icon font is a render-blocking third-party request and cannot be
  self-hosted from the zip (the font files were not included in it). Inline SVG
  also lets the accessibility tree stay clean — the source's decorative icons were
  announced as glyphs.

## 3. Google Fonts → self-hosted `@fontsource` files

* **In the zip:** **zero `@font-face` rules.** The template only names `"Roboto"`
  and relies on the CDN.
* **Here:** twelve `.woff2` files in `public/fonts/` (Playfair Display for display
  serif, Roboto for body, Roboto Condensed for eyebrows and metadata, a mono for
  references), declared in `src/styles/fonts.css` with `font-display: swap`.
* **Why:** `next/font/google` cannot fetch at build time in this environment, and a
  CDN link would reintroduce the render-blocking request the brief's performance
  and reduced-motion requirements argue against. The brief's typography rules
  (serif headings, body ≥15px, metadata ≥11px, nav 13px, buttons 12px) are met by
  these faces. **This is the one place where the brief's own fallback spec is used
  rather than the zip**, because the zip had nothing to reproduce.

## 4. Owl Carousel → CSS scroll-snap rails

* **In the zip:** the template's portfolio/team carousels were driven by Owl.
* **Here:** `src/components/lots/HorizontalRail.tsx` — a native horizontal
  scroll-snap list with keyboard arrow navigation, `aria-label` of the form
  *"Upcoming auctions, 12 items."*, and no JavaScript dependency for the scroll
  itself.
* **Why:** Owl is jQuery-era and drag-only; a scroll-snap rail works with a
  trackpad, a touch screen, a keyboard and a switch, keeps the DOM order = reading
  order, and degrades to a wrapped grid under `prefers-reduced-motion` (EFFECT-15).

## 5. Vercel Edge WebSocket → custom `server.mjs` + SSE + polling

* **In the brief:** a WebSocket on the Edge runtime broadcasting bids.
* **Here:** `server.mjs` runs Next's handler and attaches a `ws` server to the same
  HTTP server at `/api/ws`, with `src/lib/realtime.ts` bridging into Next's route
  handlers through `globalThis.__lahHub`. `/api/ws` also answers a plain `GET` with
  Server-Sent Events, so a deployment without the custom server still gets a push
  channel. The client (`useAuctionChannel`) degrades **WS → SSE → 2 s polling**,
  with the polling fallback the brief asks for.
* **Why:** Next.js route handlers cannot accept a raw HTTP `upgrade`, and Vercel's
  Edge runtime does not expose a WebSocket *server*. A custom server is the only
  host that genuinely holds a socket, so it is the primary transport, and the two
  fallbacks keep the auction room correct everywhere else. The bid itself is always
  written to the store first — the socket only carries the announcement.

## 6. `middleware.ts` → `proxy.ts`

* Next 16.4.0 renamed the middleware convention. `src/proxy.ts` exports `proxy`
  and does the same work the brief specifies for middleware: per-IP rate limiting
  on the bid and form endpoints, `X-Request-Id`, and `no-store` on the API. The
  rate-limit counters are the same `RATE_LIMIT_BID_PER_MIN` /
  `RATE_LIMIT_FORM_PER_MIN` values.

## 7. Vercel KV → KV with an in-process fallback

* `src/lib/store.ts` uses `@vercel/kv` when `KV_REST_API_URL` and
  `KV_REST_API_TOKEN` are present, and otherwise keeps bid state, bidder
  registrations and auction room state in a `globalThis`-anchored in-memory store
  that survives HMR.
* **Why:** so the live preview and a fresh clone work with no cloud account, and so
  the brief's KV requirement is a configuration switch rather than a prerequisite.
  On a serverless platform the in-memory store is per-instance, which is exactly
  why the WebSocket degrades to polling — see §5.

## 8. `next/font` → static `@font-face`, and one layout trade-off

`src/app/layout.tsx` deliberately does **not** read `headers()` or `cookies()`.
Doing so would opt the whole shell into dynamic rendering and silently cancel the
ISR windows the brief specifies (`/artists/[slug]` 600 s, `/results`, `/catalogue`
and the legal pages 3600 s). The navbar countdown stays accurate because
`<NavTicker>` is a client component that recomputes on mount and every second
after; a cached shell is corrected within a frame.

## 9. What was *not* extended

* The four source tokens, the section rhythm, the navbar, the hero, the footer
  including the **HTML Codex credit** (required by the design source's
  `LICENSE.txt`) are reproduced as found.
* No design-source file was edited, moved or deleted. `_reference/painter-1.0.0/`
  is the untouched archive and is excluded from both the build
  (`outputFileTracingExcludes`) and type-checking (`tsconfig.json` `exclude`).
* Where the zip contained nothing at all — loading screen, cookie consent, CAPTCHA,
  legal pages, 404 and 500, the API surface, environment variables and the
  `package.json` — the brief's own fallback specifications were implemented exactly
  as written, which is recorded section by section in `DESIGN-INVENTORY.md`.
