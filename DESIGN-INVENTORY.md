# DESIGN SOURCE INVENTORY — Lydia Auction House

> Written **before** any new code, per the brief.
> Source archive: `painter-1.0.0.zip` (915,953 bytes, 147 files, SHA-1 `d475c20fe78b51851597d9a259efa53a3dc39da3`)
> Unpacked to: `_reference/painter-1.0.0/` (excluded from the Next.js build via `tsconfig`/`next.config` ignore + `.gitignore` review)

---

## 1. FILE TREE (full, verbatim)

```
painter-1.0.0/
├── LICENSE.txt                                  1,422 B
├── READ-ME.txt                                    546 B
├── about.html                                  19,089 B
├── blog.html                                   27,246 B
├── contact.html                                15,978 B
├── detail.html                                 24,992 B
├── index.html                                  30,945 B
├── service.html                                19,042 B
├── team.html                                   21,910 B
├── testimonial.html                            13,985 B
├── painting-company-website-template.jpg      105,760 B
├── css/
│   ├── bootstrap.min.css                      164,112 B   (Bootstrap 5.0.0, customized theme colours)
│   └── style.css                                5,552 B   ← THE DESIGN TOKEN SOURCE
├── img/
│   ├── about-1.jpg    49,093 B      about-2.jpg       68,572 B
│   ├── about-bg.jpg    3,510 B      blog-1.jpg        30,709 B
│   ├── blog-2.jpg     29,663 B      blog-3.jpg        30,361 B
│   ├── call-to-action.jpg 68,113 B  footer.jpg        16,484 B
│   ├── hero.jpg      134,758 B      quote.jpg         89,167 B
│   ├── service.jpg     3,625 B      team-1.jpg        16,843 B
│   ├── team-2.jpg     24,255 B      team-3.jpg        21,254 B
│   ├── team.jpg        6,457 B      testimonial-1.jpg  5,156 B
│   ├── testimonial-2.jpg 5,364 B    testimonial.jpg   67,135 B
│   └── user.jpg        3,511 B
├── js/
│   └── main.js                                   1,641 B   (jQuery: sticky nav, back-to-top, owl carousel)
├── lib/
│   ├── easing/{easing.js 4,092 B, easing.min.js 2,302 B}
│   ├── owlcarousel/
│   │   ├── LICENSE 1,090 B
│   │   ├── owl.carousel.js 85,368 B / owl.carousel.min.js 42,766 B
│   │   └── assets/{ajax-loader.gif, owl.carousel.css, owl.carousel.min.css,
│   │                owl.theme.default.css/.min.css, owl.theme.green.css/.min.css,
│   │                owl.video.play.png}
│   └── waypoints/{links.php 77 B, waypoints.min.js 9,028 B}
└── scss/
    ├── bootstrap.scss 477 B
    └── bootstrap/scss/  (stock Bootstrap 5.0.0 source: 33 partials
                          + forms/7, helpers/7, mixins/22, utilities/1, vendor/1)
```

**Total: 147 files.** Non-asset source: 8 HTML pages, 1 CSS theme, 1 JS file, 1 SCSS entry, full Bootstrap 5.0.0 SCSS tree, 3 vendor JS libs.

---

## 2. CSS CUSTOM PROPERTIES AND TOKENS — VERBATIM

### 2a. `css/style.css` lines 1–7 (the only authored `:root` block in the archive)

```css
/********** Template CSS **********/
:root {
    --primary: #FFE468;
    --secondary: #8CC641;
    --light: #F2F2F2;
    --dark: #272630;
}
```

**These four declarations are the complete authored token set of the design source.** They are reproduced verbatim in `src/styles/tokens.css`.

### 2b. `css/bootstrap.min.css` `:root` block — VERBATIM (theme colours re-injected by the template author)

```css
:root{
  --bs-blue:#0d6efd; --bs-indigo:#6610f2; --bs-purple:#6f42c1; --bs-pink:#d63384;
  --bs-red:#dc3545; --bs-orange:#fd7e14; --bs-yellow:#ffc107; --bs-green:#198754;
  --bs-teal:#20c997; --bs-cyan:#0dcaf0; --bs-white:#fff; --bs-gray:#6c757d;
  --bs-gray-dark:#343a40;
  --bs-primary:#FFE468;      /* ← overridden from default #0d6efd */
  --bs-secondary:#8CC641;    /* ← overridden from default #6c757d */
  --bs-success:#198754; --bs-info:#0dcaf0; --bs-warning:#ffc107; --bs-danger:#dc3545;
  --bs-light:#F2F2F2;        /* ← overridden from default #f8f9fa */
  --bs-dark:#272630;         /* ← overridden from default #212529 */
  --bs-font-sans-serif:"Roboto",sans-serif;
  --bs-font-monospace:SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
  --bs-gradient:linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0))
}
:root{scroll-behavior:smooth}
```

Bootstrap 5.0.0 baseline also supplies (unmodified) `--bs-body-font-family/-font-size/-font-weight/-line-height`, `--bs-body-color`, `--bs-body-bg`, `--bs-border-width/-color/-radius`, `--bs-gutter-x/-y`, and the full type scale `--bs-font-size-*`.

### 2c. Derived / repeated values extracted from `style.css` (used as extension tokens)

| Value | Where it appears | New token |
|---|---|---|
| `.5s` | every `transition:` in the theme (nav links, buttons, tiles, diamonds, team text) | `--tpl-transition-duration: .5s` |
| `0 8px 6px -6px #555555` | `.btn:hover` box-shadow (vendor-prefixed trio) | `--tpl-btn-shadow-hover` |
| `36px` / `28px` / `46px` | `.btn-square` / `.btn-sm-square` / `.btn-lg-square` | `--tpl-square-sm/md/lg` |
| `5px` | nav link `::before` underline height | `--tpl-underline-h: 5px` |
| `rotate(-45deg)` | `.service-icon` / `.contact-icon` — the **diamond motif** | `--tpl-rotate-diamond: -45deg` |
| `rotate(45deg)` | counter-rotation of the icon inside the diamond | `--tpl-rotate-counter: 45deg` |
| `-50px` | negative top margin pulling the diamond over the card edge | `--tpl-diamond-overhang: -50px` |
| `100px` | diamond outer size | `--tpl-diamond-size: 100px` |
| `90px` / `45px` | `.team-text` height and inset; `margin-bottom:45px` on `.team-item` | `--tpl-team-h`, `--tpl-team-inset` |
| `border-end border-5` | navbar nav block right border | `--tpl-nav-border-w: 5px` |
| `w-25` | `<hr>` accent under every footer/heading | `--tpl-hr-w: 25%` |

### 2d. Background-image classes (layout motifs preserved)

`.bg-hero` → `img/hero.jpg top right / contain` · `.bg-quote` → `img/quote.jpg top right / contain` · `.bg-testimonial` → `img/testimonial.jpg top left / contain` · `.bg-call-to-action` → `img/call-to-action.jpg top right / contain` · `.bg-footer` → `img/footer.jpg center / contain` · `.about-start/.about-end` → `img/about-bg.jpg center / contain` (with `∓90px` negative margin overlap at ≥992px) · `.service-item/.contact-item` → `img/service.jpg top center; :hover → bottom center` (a 5 s background-position swap — **the ancestor of EFFECT-18's "background-position animation only" rule**). All `contain` → `cover` below 992 px.

---

## 3. `@font-face` RULES IN THE ZIP — EXACT

**Result: THE ZIP CONTAINS ZERO `@font-face` RULES.**

- `grep -c "@font-face"` across all `*.css`, `*.scss`, `*.html` → **0 matches**, including `css/bootstrap.min.css` (the stock Bootstrap 5.0.0 build ships without webfont declarations).
- Fonts are loaded by external `<link>`, byte-identical in all 8 HTML files (lines 15–16):

```html
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
```

- Effective families resolved by Bootstrap's variables:
  - `--bs-font-sans-serif: "Roboto", sans-serif` → **body**
  - `Roboto Condensed` is pulled but not referenced by name in `style.css`; Bootstrap's `_type.scss` maps `h1–h6` to `inherit`, so the theme renders headings in the body stack, with the *visual* heading treatment coming from `.text-uppercase` + `fw-bold` + `.display-1/.display-5`.
- Icons: Font Awesome 5.15.0 (`cdnjs`) and Bootstrap Icons 1.4.1 (`jsdelivr`).

### Consequence for the typography brief
The brief requires **serif headings for gallery prestige**, and states "From zip or reference only". The zip has **no serif face**. Resolution applied and documented:

1. `--font-group-body` / `--font-group-heading` **reproduce the zip exactly** (`Roboto`, `Roboto Condensed`) and remain the token of record.
2. A single **extension token** `--font-display` introduces the serif required by the brief. Declared through `next/font/google` (self-hosted, emits real `@font-face` — the archive emitted none). Documented in `EXTENSIONS.md`.

---

## 4. LOADING SCREEN — WHAT THE ZIP HAS

**ABSENT.** Searched `preloader|loading|loader|spinner|progress` across all HTML/CSS/JS. Only match outside vendor code:

```
lib/owlcarousel/assets/owl.carousel.css:66  .owl-carousel.owl-loading { opacity: 0; display: block; }
```

That is Owl Carousel internals, not a page loading screen. There is **no** overlay, no progress bar, no timing, no `role="status"`. `js/main.js` performs zero eager work.

→ **Fallback required by the brief is used**: paintbrush SVG sweep, wordmark in the wake, progress fill, skip at 3 s, `role="status"`, <2 s, plain-text percentage under reduced motion. Built as `LoadingScreen.tsx` + `loading.tsx`.

---

## 5. COOKIE CONSENT BANNER — WHAT THE ZIP HAS

**ABSENT.** `grep -rni "cookie"` across all `*.html`, `*.js`, `*.css` (excluding vendor) → **0 matches**. No banner, no modal, no `localStorage` consent key, no policy link.

→ **Fallback required by the brief is used**: bottom-fixed full-width, the specified copy, Accept All + Manage Preferences, modal with Necessary (locked) / Functional / Analytics / Marketing, `localStorage` persistence, `/legal/cookie-policy`, Kenya Data Protection Act 2019 wording.

---

## 6. CAPTCHA — WHAT THE ZIP HAS

**ABSENT.** `grep -rni "captcha"` across every file in the archive → **0 matches**. No provider, no site key, no server verification, no `<script src="...recaptcha...">`.

→ **Provider selected per the brief**: **Google reCAPTCHA v3 (invisible)**, with a v2 checkbox fallback triggered when the v3 score `< 0.5`. Secret held server-side only (`RECAPTCHA_SECRET_KEY`); site key exposed (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`). Protected surfaces: bidder registration, bid submission, direct purchase, artist submission, contact form, newsletter signup.

---

## 7. LEGAL PAGES — WHAT THE ZIP HAS

**ABSENT.** The archive's 8 pages are `index`, `about`, `service`, `team`, `blog`, `detail`, `testimonial`, `contact`. There is **no** privacy policy, terms, or cookie policy; the only legal artefact is `LICENSE.txt` (the template's own CC-BY-4.0 + credit-removal terms).

→ **Fallback required by the brief is used**: `/legal/privacy-policy`, `/legal/terms`, `/legal/cookie-policy` with the specified section structures.

---

## 8. 404 AND 500 PAGE DESIGNS — WHAT THE ZIP HAS

**ABSENT.** No `404.html`, no `500.html`, no `.error` markup. `README`/`LICENSE` confirm the template ships 8 static pages only.

→ **Fallback required by the brief is used**: 404 = "This lot was not found. It may have been sold." + CTA "Browse Live Auctions."; 500 = "Something went wrong in the auction room. We are fixing it." + Try Again + visible WhatsApp.

---

## 9. API ROUTES AND PROJECT STRUCTURE — WHAT THE ZIP HAS

**ABSENT — there is no backend of any kind.**
- No `package.json`, no `next.config`, no `vercel.json`, no lockfile, no bundler config.
- No `api/` directory anywhere in the 147 files.
- Forms are inert: `<form action="">` (contact.html, footer newsletter) with **no `method`, no handler, no endpoint**. `lib/waypoints/links.php` is a 77-byte Owl/waypoints shim, not an application route.

The archive is **static HTML + Bootstrap 5.0.0 + jQuery 3.x (CDN) + Owl Carousel + Waypoints + jQuery Easing**, served as flat files.

→ All routes in the brief are **new build** (see `API-CONTRACT.md`).

---

## 10. ENVIRONMENT VARIABLES — WHAT THE ZIP HAS

**ABSENT.** Zero env files, zero `process.env` references, no secrets, no build-time config. All three CDN dependencies are hard-coded absolute URLs in the HTML.

→ All variables in the brief are **new build** (see `.env.example`).

---

## 11. PACKAGE VERSIONS — WHAT THE ZIP HAS

**ABSENT.** No `package.json` exists in the archive. Dependency set is CDN/`<script>`-only and **unpinned**:

| Library | Declared | Source |
|---|---|---|
| Bootstrap | `5.0.0` (from `bootstrap.min.css` banner) | vendored in `css/` + `scss/` |
| jQuery | unpinned (`$(...)` used in `main.js`) | CDN in HTML |
| Font Awesome | `5.15.0` | `cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.0/css/all.min.css` |
| Bootstrap Icons | `1.4.1` | `cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css` |
| Owl Carousel | `2.x` (vendored) | `lib/owlcarousel/` |
| Waypoints | vendored, min only | `lib/waypoints/waypoints.min.js` |
| jQuery Easing | vendored | `lib/easing/` |
| Google Fonts | Roboto / Roboto Condensed `wght@400;700` | `fonts.googleapis.com` |

### Template dependency → modern replacement map

| Zip | Replacement | Why |
|---|---|---|
| Bootstrap 5.0.0 vendored CSS | **Tailwind CSS v4.3.3** with the zip's `:root` tokens ported into `@theme` | Utility parity without 164 KB of unused CSS; keeps the 4 tokens authoritative |
| jQuery + `js/main.js` | React 19.3.0 / Next.js 16.4.0 | Sticky-nav + back-to-top + carousel logic reimplemented natively |
| Owl Carousel | CSS `scroll-snap` rail (EFFECT-15) | Drop 85 KB jQuery plugin; native, keyboard-accessible, reduced-motion aware |
| Waypoints | `IntersectionObserver` | Native, no plugin |
| jQuery Easing (`easeInOutExpo`) | CSS `cubic-bezier` / `scroll-behavior:smooth` | Native |
| Font Awesome 5.15.0 + Bootstrap Icons 1.4.1 | Inline SVG sprite | Removes 2 CDN render-blockers; keeps exact glyph shapes where used |
| Roboto / Roboto Condensed | `next/font/google` self-hosted | Same families, no third-party request, eliminates CLS |

The archive's `LICENSE.txt` requires the HTML Codex credit link stay in place. **Preserved** in the footer colophon. The `_reference/` directory retains the untouched archive for audit.

---

## 12. APPLICATION VERSIONS (new build, per brief — all verified against the npm registry)

| Package | Requested | Published latest | Pinned |
|---|---|---|---|
| `next` | 16.4.0 | **16.4.0** ✅ | `16.4.0` |
| `react` | 19.3.0 | **19.3.0** ✅ | `19.3.0` |
| `react-dom` | 19.3.0 | **19.3.0** ✅ | `19.3.0` |
| Node | 24.21.0 | **v24.21.0** ✅ (released 2026-09-08) | `.nvmrc` + `engines.node >=24.0.0` |
| `three` | — | 0.186.1 | `0.186.1` (EFFECT-01) |
| `ws` | — | 8.22.0 | `8.22.0` (EFFECT-05) |
| `@vercel/kv` | — | 3.0.0 | `3.0.0` |
| `@vercel/blob` | — | 2.8.1 | `2.8.1` |
| `nodemailer` | — | 10.1.0 | `10.1.0` |
| `tailwindcss` | — | 4.3.3 | `4.3.3` |
| `typescript` | — | 7.0.2 | `5.9.3` (stable toolchain; 7.0 is the native-port line) |

`next@16.4.0` `engines.node` is `>=20.9.0`, so `engines.node: ">=24.0.0"` is satisfied by the `.nvmrc` pin and does not conflict.

---

## 13. PAGE / SECTION INVENTORY OF THE SOURCE (structure inherited)

Every one of the 8 pages carries the same shell — **Topbar → Navbar → [page body] → Call To Action → Footer → Yellow copyright band**, in that order. Section comments are `<!-- X Start -->` / `<!-- X End -->`.

`index.html` sections, in order:
`Topbar · Navbar · Hero · About · Services · Quote · Team · Testimonial · Blog · Call To Action · Footer`

Components extracted from that shell and carried forward:

- **Topbar** — `container-fluid bg-primary`, phone + email left (`border-end border-white`), 5 social icons right. *→ becomes the glassmorphic sticky nav's utility strip (EFFECT-28).*
- **Navbar** — `navbar-expand-lg bg-dark navbar-dark shadow-sm px-5`, wordmark as `<h1 class="m-0 text-uppercase text-primary">`, nav block closed with `border-end border-5 border-primary` + `pe-4`, `ms-auto`. *→ becomes the 7-link nav + countdown ticker (EFFECT-28); the 5 px yellow right border is preserved.*
- **Hero** — `container-fluid bg-primary py-5 bg-hero`, `col-lg-8 text-center text-lg-start`, `h1.display-1.text-dark`, `p.fs-4.text-dark.mb-4`, two pill CTAs (`btn-secondary` + `btn-outline-secondary`), `margin-bottom:90px`. *→ becomes the full-screen editorial hero (EFFECT-01/04/09/18/23), keeping the two-CTA pill pattern and the 90 px bottom rhythm.*
- **Card motifs** — the `rotate(-45deg)` diamond icon overhanging the card top by 50 px, white outer / `--primary` inner, flipping to `--secondary` inner + `--primary` icon on hover; and a card CTA that rises `bottom: -30px → 0` with `opacity 0 → 1`. *→ becomes the lot/artist/step card motif.*
- **Quote band, Team grid, Testimonial carousel, Blog grid** — *→ become Featured Lots rail, Artists grid, Results table, Catalogue.*
- **Call To Action band** — full-width image band with heading + one button. *→ becomes the CTA band with EFFECT-18 gradient.*
- **Footer** — `bg-dark bg-footer`, 4 columns (`Get In Touch` / `Our Services` / `Quick Links` / `Newsletter`), each headed by `h4.text-primary` over `hr.w-25.text-secondary`, social row of 4 × `btn-lg btn-primary btn-lg-square rounded-circle`. *→ becomes the auction footer, **plus the required legal links, WhatsApp and newsletter signup**.*
- **Copyright band** — `container-fluid bg-primary text-dark py-4`, HTML Codex credit retained.

---

## 14. GAPS SUMMARY — "COPY FROM ZIP" VS "BUILD PER BRIEF"

| Brief item | In zip? | Action |
|---|---|---|
| CSS custom properties / tokens | ✅ 4 authored + Bootstrap theme vars | **Reproduce verbatim**, extend |
| `@font-face` rules | ❌ none | Declare via `next/font`; zip families kept as tokens |
| Loading screen + timing | ❌ absent | Brief's paintbrush fallback, full spec |
| Cookie consent banner | ❌ absent | Brief's fallback, full spec, KDPA 2019 |
| CAPTCHA + provider | ❌ absent | reCAPTCHA v3 + v2 fallback, server-verified |
| Legal page layouts | ❌ absent | 3 pages, brief's section list |
| 404 / 500 designs | ❌ absent | Brief's exact copy |
| API route names / structure | ❌ absent | 10 routes per brief |
| Env variable names | ❌ absent | 14 vars per brief |
| Package versions | ❌ absent | Pinned per §12 |
| Everything else (all effects, auction room, WebSockets, 3D, flipbook) | ❌ absent | New build on the zip's tokens |

**Nothing in the zip is redesigned.** The 4 tokens, the diamond motif, the pill buttons, the `.5s` transition, the `0 8px 6px -6px #555` hover shadow, the 90 px section rhythm, the dark/yellow footer-and-band structure and the HTML Codex credit are all carried forward unchanged.
