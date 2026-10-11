import type { Metadata } from 'next';
import Link from 'next/link';

import { site } from '@/lib/site';
import { auctions, liveAuction, upcomingAuctions } from '@/data/auctions';
import { liveLots } from '@/data/lots';
import { formatDate, formatTime, relativeDayLabel } from '@/lib/format';
import { BidderRegisterForm } from '@/components/forms/BidderRegisterForm';

export const metadata: Metadata = {
  title: 'Register to Bid',
  description:
    'Register with Lydia Auction House and we will issue you a paddle number. Free, takes a minute, and creates no obligation to bid.',
  alternates: { canonical: '/register' },
};

export const dynamic = 'force-dynamic';

const BEFORE = [
  {
    heading: 'What you need',
    body: 'Your name, an email address and a telephone number. That is all. We do not ask for card details to register, and we never charge a registration fee.',
  },
  {
    heading: 'What happens next',
    body: 'You get a paddle number on screen straight away, and by email. Use it in the saleroom or online. The auction room recognises you on this device, so you will not need to sign in again.',
  },
  {
    heading: 'What it commits you to',
    body: 'Nothing. Registering does not oblige you to bid, and losing an auction costs you nothing. If you win, the terms of sale apply: hammer price plus the 15% buyer\u2019s premium, payable within seven days.',
  },
] as const;

export default function RegisterPage() {
  const nextSale = upcomingAuctions[0] ?? liveAuction;

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--surface-sunken)]">
        <div className="shell py-10 md:py-14">
          <p className="eyebrow">Bidding</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            Register to Bid
          </h1>
          <p className="lead mt-4 max-w-[62ch]">
            One registration covers every sale. We issue a paddle number immediately, and there is no
            fee and no obligation — you only ever pay for something you have won.
          </p>
        </div>
      </header>

      <div className="shell grid gap-12 py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <section aria-labelledby="form-heading">
          <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-7">
            <h2
              id="form-heading"
              className="font-[family-name:var(--font-display)] text-[var(--text-h3)]"
            >
              Your details
            </h2>
            <hr className="rule-accent mt-4" />
            <p className="mt-4 text-[var(--text-meta)] leading-relaxed text-[var(--ink-muted)]">
              We use these details to issue your paddle, to invoice you if you win, and to reach you
              during a live sale. Nothing else — see the{' '}
              <Link href="/legal/privacy-policy" className="underline decoration-2 underline-offset-2">
                privacy policy
              </Link>
              .
            </p>

            <BidderRegisterForm className="mt-7" />
          </div>

          <p className="mt-5 text-[var(--text-meta)] text-[var(--ink-muted)]">
            Already registered? Use the{' '}
            <Link href="/contact" className="underline decoration-2 underline-offset-2">
              contact form
            </Link>{' '}
            or{' '}
            <a
              href={site.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-2 underline-offset-2"
            >
              WhatsApp the house
            </a>{' '}
            and we will reissue your paddle.
          </p>
        </section>

        <aside className="space-y-8">
          {/* ══ Why register ══════════════════════════════════════════════ */}
          <section aria-labelledby="before-heading">
            <h2 id="before-heading" className="eyebrow">
              Before you register
            </h2>
            <dl className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {BEFORE.map((item) => (
                <div key={item.heading} className="py-4">
                  <dt className="font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                    {item.heading}
                  </dt>
                  <dd className="mt-1.5 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ══ Ways to bid ═══════════════════════════════════════════════ */}
          <section
            className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-6"
            aria-labelledby="ways-heading"
          >
            <h2 id="ways-heading" className="eyebrow">
              Ways to bid
            </h2>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 grid h-8 w-8 shrink-0 rotate-[-45deg] place-items-center bg-[var(--primary)]"
                >
                  <span className="rotate-45 text-[13px] font-bold text-[var(--dark)]">1</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-[family-name:var(--font-display)] text-[var(--text-ui)]">
                    Online, in the live room
                  </span>
                  <span className="block text-[var(--text-meta)] text-[var(--ink-muted)]">
                    Bid on the lot page or in the saleroom view. Updates arrive in real time, with a
                    polling fallback if your connection drops.
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 grid h-8 w-8 shrink-0 rotate-[-45deg] place-items-center bg-[var(--secondary)]"
                >
                  <span className="rotate-45 text-[13px] font-bold text-[var(--dark)]">2</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-[family-name:var(--font-display)] text-[var(--text-ui)]">
                    Commission bid
                  </span>
                  <span className="block text-[var(--text-meta)] text-[var(--ink-muted)]">
                    Leave your maximum with us and the auctioneer bids on your behalf, as cheaply as
                    possible. Nothing above your figure is ever committed.
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 grid h-8 w-8 shrink-0 rotate-[-45deg] place-items-center bg-[var(--primary)]"
                >
                  <span className="rotate-45 text-[13px] font-bold text-[var(--dark)]">3</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-[family-name:var(--font-display)] text-[var(--text-ui)]">
                    Telephone or in the saleroom
                  </span>
                  <span className="block text-[var(--text-meta)] text-[var(--ink-muted)]">
                    We will call you from the saleroom for lots over KES 500,000, or you can bid in
                    person on Kimathi Street.
                  </span>
                </span>
              </li>
            </ul>
          </section>

          {/* ══ The next sale ═════════════════════════════════════════════ */}
          <section
            className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-6"
            aria-labelledby="next-sale-heading"
          >
            <h2 id="next-sale-heading" className="eyebrow">
              What you can bid on now
            </h2>
            <p className="mt-3 font-[family-name:var(--font-display)] text-[var(--text-h4)]">
              {liveAuction.title}
            </p>
            <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
              {liveLots.length} lots open · closes {formatDate(liveAuction.endsAt)} at{' '}
              {formatTime(liveAuction.endsAt)} EAT
            </p>
            <p className="mt-4 border-t border-[var(--line)] pt-4 text-[var(--text-meta)] text-[var(--ink-muted)]">
              Next after that: <strong className="font-semibold">{nextSale.title}</strong>,{' '}
              {relativeDayLabel(nextSale.startsAt)} ({formatDate(nextSale.startsAt)}).{' '}
              {auctions.length} sales on the calendar this year.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/live-auctions" className="pill-btn pill-btn--dark">
                Enter the live room
              </Link>
              <Link href="/catalogue" className="pill-btn pill-btn--ghost">
                Read the catalogue
              </Link>
            </div>
          </section>

          {/* ══ Help ══════════════════════════════════════════════════════ */}
          <section
            className="rounded-[var(--radius-lg)] bg-[var(--dark)] p-6 text-white"
            aria-labelledby="help-heading"
          >
            <h2 id="help-heading" className="eyebrow-invert">
              Need a hand?
            </h2>
            <p className="mt-3 text-[var(--text-meta)] leading-relaxed text-white/72">
              If anything here is unclear, telephone the house on{' '}
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="underline decoration-2 underline-offset-2">
                {site.phone}
              </a>{' '}
              or message us. Someone is at the desk from 10:00 on sale days.
            </p>
            <a
              href={site.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-btn pill-btn--primary mt-5"
            >
              WhatsApp the house
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}
