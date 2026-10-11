import type { Metadata } from 'next';
import Link from 'next/link';

import { site } from '@/lib/site';
import { ContactForm } from '@/components/forms/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Visit the saleroom on Kimathi Street, telephone the house, message us on WhatsApp, or send a private sale enquiry.',
  alternates: { canonical: '/contact' },
};

export const dynamic = 'force-dynamic';

export default function ContactPage() {
  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--surface-sunken)]">
        <div className="shell py-10 md:py-14">
          <p className="eyebrow">The house</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            Contact and visit
          </h1>
          <p className="lead mt-4 max-w-[62ch]">
            We are on the second floor of The Loft on Kimathi Street, in the middle of Nairobi CBD.
            Come and see the work in person before you bid — we recommend it, and there is no
            obligation to buy anything.
          </p>
        </div>
      </header>

      <div className="shell grid gap-12 py-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        {/* ══ Details + map ═══════════════════════════════════════════════ */}
        <div>
          <section aria-labelledby="address-heading">
            <h2 id="address-heading" className="eyebrow">
              Gallery address
            </h2>
            <address className="mt-3 not-italic">
              <p className="font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                Lydia Auction House
              </p>
              {site.addressLines.map((line) => (
                <span key={line} className="block text-[var(--text-body-min)] text-[var(--ink-muted)]">
                  {line}
                </span>
              ))}
            </address>

            <ul className="mt-5 space-y-2">
              <li>
                <a
                  href={`tel:${site.phone.replace(/\s/g, '')}`}
                  className="inline-flex min-h-12 items-center gap-3 text-[var(--text-body-min)] underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
                >
                  <span aria-hidden="true" className="text-[var(--secondary)]">
                    ☎
                  </span>
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex min-h-12 items-center gap-3 break-all text-[var(--text-body-min)] underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
                >
                  <span aria-hidden="true" className="text-[var(--secondary)]">
                    ✉
                  </span>
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill-btn pill-btn--secondary mt-2"
                >
                  WhatsApp the house
                </a>
              </li>
            </ul>
          </section>

          {/* Google Maps embed. `loading="lazy"` keeps it off the critical path,
              and a text fallback is offered for anyone who cannot load it. */}
          <section className="mt-10" aria-labelledby="map-heading">
            <h2 id="map-heading" className="eyebrow">
              Find us
            </h2>
            <div className="mt-3 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--light)]">
              <iframe
                title="Map showing Lydia Auction House on Kimathi Street, Nairobi"
                src={site.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] w-full border-0"
              />
            </div>
            <p className="mt-2 text-[11px] text-[var(--ink-subtle)]">
              Map not loading?{' '}
              <a
                href={site.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-2 underline-offset-2"
              >
                Open Kimathi Street in Google Maps
              </a>
              . Nearest matatu stage: Koja. Parking at Kimathi Street Car Park, 200 m.
            </p>
          </section>

          <section className="mt-10" aria-labelledby="hours-heading">
            <h2 id="hours-heading" className="eyebrow">
              Opening hours
            </h2>
            <dl className="mt-3 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {site.hours.map((entry) => (
                <div key={entry.days} className="flex justify-between gap-4 py-3">
                  <dt className="text-[var(--text-body-min)] text-[var(--ink-muted)]">
                    {entry.days}
                  </dt>
                  <dd className="text-[var(--text-body-min)] [font-variant-numeric:tabular-nums]">
                    {entry.time}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] leading-relaxed text-[var(--ink-subtle)]">
              Auction days differ — the saleroom opens two hours before the first lot on the day of
              a sale, and closes thirty minutes after the last.
            </p>
          </section>

          <section className="mt-10" aria-labelledby="access-heading">
            <h2 id="access-heading" className="eyebrow">
              Access
            </h2>
            <p className="mt-3 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
              There is a lift to the second floor and step-free access from the Kimathi Street
              entrance. If you would like a member of staff to meet you at the door, telephone ahead
              and we will arrange it. Large-print catalogues and a hearing loop in the saleroom are
              available on request.
            </p>
          </section>
        </div>

        {/* ══ Enquiry form ═══════════════════════════════════════════════ */}
        <div>
          <section
            className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-7"
            aria-labelledby="enquiry-heading"
          >
            <p className="eyebrow">Private sale enquiry</p>
            <h2
              id="enquiry-heading"
              className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
            >
              Send us a message
            </h2>
            <hr className="rule-accent mt-4" />
            <p className="mt-4 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
              Buying, selling, or just asking — this reaches the house inbox directly and a person
              answers it. Tell us what you are looking for and we will come back to you with what we
              actually have, including works that are not catalogued.
            </p>

            <ContactForm className="mt-7" />
          </section>

          <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-7">
            <h2 className="eyebrow">Other ways in</h2>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  href="/sell#submit"
                  className="font-[family-name:var(--font-display)] text-[var(--text-h4)] underline-offset-4 hover:underline"
                >
                  Consign a work
                </Link>
                <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
                  Send photographs and a description for a free assessment.
                </p>
              </li>
              <li>
                <Link
                  href="/register"
                  className="font-[family-name:var(--font-display)] text-[var(--text-h4)] underline-offset-4 hover:underline"
                >
                  Register to Bid
                </Link>
                <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
                  Free, takes a minute, creates no obligation.
                </p>
              </li>
              <li>
                <Link
                  href="/legal/privacy-policy"
                  className="font-[family-name:var(--font-display)] text-[var(--text-h4)] underline-offset-4 hover:underline"
                >
                  How we handle your data
                </Link>
                <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
                  Your rights under the Kenya Data Protection Act 2019.
                </p>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
