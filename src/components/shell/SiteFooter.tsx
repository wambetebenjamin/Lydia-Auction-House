import Link from 'next/link';
import { site } from '@/lib/site';
import { liveAuction } from '@/data/auctions';
import { formatDate } from '@/lib/format';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { CookiePreferencesLink } from './CookiePreferencesLink';
import { TickerLine } from './TickerLine';

/**
 * Footer.
 *
 * Structure inherited from the design source: a dark `bg-footer` block of four
 * columns, each headed by an `h4` over a short accent rule, a four-button
 * circular social row, then the full-width yellow copyright band.
 *
 * Required additions from the brief: auctions / artists / catalogue / sell with
 * us links, the legal links, social media, newsletter signup and WhatsApp.
 *
 * Required by the design source's own licence (LICENSE.txt): the HTML Codex
 * credit link is retained in the copyright band.
 */

const COLUMNS = [
  {
    heading: 'Auctions',
    links: [
      { label: 'Live Auctions', href: '/live-auctions' },
      { label: 'Auction Calendar', href: '/auction' },
      { label: 'Upcoming Lots', href: '/upcoming-lots' },
      { label: 'Full Catalogue', href: '/catalogue' },
      { label: 'Past Results', href: '/results' },
      { label: 'Register to Bid', href: '/register' },
    ],
  },
  {
    heading: 'Discover',
    links: [
      { label: 'Artists', href: '/artists' },
      { label: 'Paintings', href: '/lots?category=paintings' },
      { label: 'Sculpture', href: '/lots?category=sculpture' },
      { label: 'Photography', href: '/lots?category=photography' },
      { label: 'Jewellery', href: '/lots?category=jewellery' },
      { label: 'Textiles', href: '/lots?category=textiles' },
    ],
  },
  {
    heading: 'Sell with Us',
    links: [
      { label: 'Consignment Process', href: '/sell' },
      { label: 'Submit a Work', href: '/sell#submit' },
      { label: 'Private Sales', href: '/contact' },
      { label: 'Buyer Premium & Terms', href: '/legal/terms' },
      { label: 'Contact the House', href: '/contact' },
    ],
  },
] as const;

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/legal/privacy-policy' },
  { label: 'Auction Terms', href: '/legal/terms' },
  { label: 'Cookie Policy', href: '/legal/cookie-policy' },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-[var(--surface-ink)] text-white">
      {/* ── Column block ─────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[var(--shell-max)] px-5 py-14 md:px-8 md:py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Get in touch */}
          <div className="lg:col-span-3">
            <h2 className="footer-heading">Get in Touch</h2>
            <hr className="rule-accent mt-3" />
            <p className="mt-4 max-w-[34ch] text-[var(--text-body-min)] leading-relaxed text-white/70">
              The house is open to the public six days a week. Come and see the works in person
              before you bid — we recommend it.
            </p>
            <address className="mt-5 not-italic text-[var(--text-meta)] leading-relaxed text-white/75">
              {site.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <ul className="mt-4 space-y-1.5 text-[var(--text-meta)]">
              <li>
                <a
                  href={`tel:${site.phone.replace(/\s/g, '')}`}
                  className="inline-flex min-h-11 items-center text-white/80 transition-colors hover:text-[var(--primary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex min-h-11 items-center break-all text-white/80 transition-colors hover:text-[var(--primary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-[var(--secondary)] transition-colors hover:text-[var(--primary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  WhatsApp the house
                </a>
              </li>
            </ul>
          </div>

          {/* Link columns */}
          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="lg:col-span-2">
              <h2 className="footer-heading">{column.heading}</h2>
              <hr className="rule-accent mt-3" />
              <ul className="mt-4">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-[var(--text-body-min)] text-white/72 transition-colors hover:text-[var(--primary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Newsletter + social */}
          <div className="lg:col-span-3">
            <h2 className="footer-heading">Newsletter</h2>
            <hr className="rule-accent mt-3" />
            <p className="mt-4 text-[var(--text-body-min)] leading-relaxed text-white/70">
              Auction dates, new arrivals, and artist spotlights delivered to your inbox.
            </p>

            <NewsletterForm className="mt-4" source="footer" />

            <h3 className="mt-7 font-[family-name:var(--font-condensed)] text-[var(--text-meta)] uppercase tracking-[0.14em] text-[var(--primary)]">
              Follow Us
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {site.social.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${site.name} on ${item.label}`}
                    className="grid h-12 w-12 place-items-center rounded-full bg-[var(--primary)] text-[var(--dark)] transition-transform duration-[220ms] ease-[var(--ease-spring)] hover:scale-105 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none"
                  >
                    <SocialIcon name={item.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <TickerLine target={liveAuction.endsAt} title={liveAuction.title} />
      </div>

      {/* ── Copyright band — the source's full-width `bg-primary` band ───── */}
      <div className="bg-[var(--primary)] text-[var(--dark)]">
        <div className="mx-auto flex w-full max-w-[var(--shell-max)] flex-col gap-3 px-5 py-5 text-[var(--text-meta)] md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
          <p>
            &copy; {year} {site.name}. All rights reserved. Buyer&rsquo;s premium 15% plus VAT.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center font-semibold underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookiePreferencesLink />
              </li>
            </ul>
            <p className="text-[var(--dark)]/75">
              {site.designCredit.text} —{' '}
              <a
                href={site.designCredit.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)]"
              >
                {site.designCredit.label}
              </a>
              . Next auction {formatDate(liveAuction.endsAt, { day: 'numeric', month: 'short' })}.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    instagram:
      'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.23-2.1.38-.5.2-.9.43-1.2.78-.35.33-.58.7-.78 1.2-.15.4-.33 1-.38 2.1C2.8 9.7 2.8 10.1 2.8 12s0 2.3.07 3.5c.05 1.1.23 1.7.38 2.1.2.5.43.9.78 1.2.33.35.7.58 1.2.78.4.15 1 .33 2.1.38 1.2.06 1.6.06 4.7.06s3.5 0 4.7-.06c1.1-.05 1.7-.23 2.1-.38.5-.2.9-.43 1.2-.78.35-.33.58-.7.78-1.2.15-.4.33-1 .38-2.1.06-1.2.06-1.6.06-4.7s0-3.5-.06-4.7c-.05-1.1-.23-1.7-.38-2.1-.2-.5-.43-.9-.78-1.2-.33-.35-.7-.58-1.2-.78-.4-.15-1-.33-2.1-.38C15.5 4 15.1 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-2.1a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z',
    facebook:
      'M14 9h2.5l.5-3h-3V4.4c0-.9.3-1.4 1.5-1.4H17V.2C16.7.2 15.8 0 14.9 0 12.5 0 11 1.4 11 4v2H8.5v3H11v9h3V9Z',
    x: 'M17.5 3h3.2l-7 8 7.3 10h-5.6l-4.4-6.2L5.9 21H2.7l7.5-8.6L3.2 3h5.7l4 5.7L17.5 3Zm-1.1 16h1.8L7.7 4.8H5.8L16.4 19Z',
    linkedin:
      'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.7c0-1.36-.03-3.1-1.95-3.1-1.96 0-2.25 1.47-2.25 2.99V21h-4V9Z',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.15rem] w-[1.15rem] fill-current">
      <path d={paths[name] ?? paths.instagram} />
    </svg>
  );
}
