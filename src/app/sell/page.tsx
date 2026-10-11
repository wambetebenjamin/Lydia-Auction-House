import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { site } from '@/lib/site';
import { soldLots } from '@/data/lots';
import { formatKES, formatNumber } from '@/lib/format';
import { SubmissionForm } from '@/components/forms/SubmissionForm';

export const metadata: Metadata = {
  title: 'Sell with Us',
  description:
    'Consign East African art with Lydia Auction House. Submit for assessment, agree your reserve, and we auction on your behalf. Free until the work sells.',
  alternates: { canonical: '/sell' },
};

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    step: '01',
    title: 'Submit for Assessment',
    duration: '3 working days',
    body: 'Send photographs and a description. Our specialists assess condition, provenance, authorship and current market, then come back with an honest estimate range. There is no charge for an assessment, and we will tell you when the answer is that a work is not right for auction.',
    points: [
      'Free, with no obligation to consign',
      'Assessment by the specialist who will catalogue the work',
      'We will tell you if a private sale would serve you better',
    ],
  },
  {
    step: '02',
    title: 'Agree Reserve and Terms',
    duration: 'At your pace',
    body: 'We propose an estimate range, a reserve and a sale date. The reserve is yours to set and we will not sell below it. Nothing is photographed, catalogued or listed until you have approved both in writing.',
    points: [
      'Reserve set by you, not by us',
      'Commission agreed in writing before anything is listed',
      'You may withdraw a work before the catalogue goes to press',
    ],
  },
  {
    step: '03',
    title: 'We Auction on Your Behalf',
    duration: 'Payment in 14 days',
    body: 'We photograph the work in the gallery, write the catalogue entry with your provenance, market it to our bidder list, and offer it in the saleroom and online simultaneously. Payment reaches you within fourteen days of the sale.',
    points: [
      'Photography in the gallery included',
      'Simulcast in the saleroom and online',
      'Settlement within fourteen days of the sale',
    ],
  },
] as const;

const FAQ = [
  {
    q: 'What does it cost to consign?',
    a: 'Nothing up front. Our commission is a percentage of the hammer price, agreed with you before the catalogue goes to press. If the work does not sell, you owe us nothing and you collect it at no charge.',
  },
  {
    q: 'Who sets the reserve?',
    a: 'You do, always. We will advise you if we think a reserve is set too high to sell, and we have told consignors so before now — including when it cost us the consignment. We will not sell below the figure you set.',
  },
  {
    q: 'Do I need to bring the work to Nairobi?',
    a: 'For works under roughly 120 cm we ask that the work be delivered to the gallery for photography and viewing. For larger works, or where that is impractical, we can arrange collection in Nairobi, Mombasa, Kisumu, Kampala and Dar es Salaam.',
  },
  {
    q: 'What sells best?',
    a: 'Strong works by artists with a documented exhibition history, in good condition, with clear provenance. Painting and sculpture dominate our sales, but well-provenanced photography, textile art and studio ceramics have all achieved records with us.',
  },
  {
    q: 'How is authenticity established?',
    a: 'Every lot is catalogued with its provenance and, where relevant, a certificate or the artist\u2019s confirmation. Where we cannot establish authorship to our satisfaction, the work is catalogued as "in the manner of" or is not offered at all.',
  },
] as const;

export default function SellPage() {
  const totalHammer = soldLots.reduce((sum, lot) => sum + (lot.soldPrice ?? 0), 0);

  return (
    <>
      <header className="relative isolate overflow-hidden bg-[var(--surface-ink)] text-white">
        <div className="gradient-hero absolute inset-0 -z-10 opacity-95" />
        <div className="shell py-12 md:py-16">
          <p className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.2em] text-[var(--primary)]">
            Consignments
          </p>
          <h1 className="mt-3 max-w-[22ch] font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight text-white">
            Sell with Us
          </h1>
          <p className="mt-4 max-w-[62ch] text-[var(--text-lead)] text-white/80">
            We have placed East African work with collectors, galleries and institutions on four
            continents. Consigning with the house is free until the work sells, and you set the
            reserve.
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5 border-t border-[var(--line-ink)] pt-6">
            <div>
              <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/50">
                Sold at auction
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] text-[var(--primary)] [font-variant-numeric:tabular-nums]">
                {formatKES(totalHammer)}
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/50">
                Lots placed
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)] [font-variant-numeric:tabular-nums]">
                {formatNumber(soldLots.length + 318)}
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/50">
                Assessment
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                Free
              </dd>
            </div>
          </dl>

          <a href="#submit" className="pill-btn pill-btn--primary mt-8">
            Submit a work now
          </a>
        </div>
      </header>

      {/* ══ The three steps ═══════════════════════════════════════════════ */}
      <section className="shell py-14" aria-labelledby="process-heading">
        <p className="eyebrow">How it works</p>
        <h2
          id="process-heading"
          className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
        >
          Three steps
        </h2>
        <hr className="rule-accent mt-4" />

        <ol className="mt-10 grid gap-6 lg:grid-cols-3">
          {STEPS.map((item) => (
            <li
              key={item.step}
              className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-7"
            >
              {/* The design source's diamond motif, unrotated at the numeral. */}
              <span
                aria-hidden="true"
                className="grid h-16 w-16 rotate-[-45deg] place-items-center bg-[var(--primary)]"
              >
                <span className="rotate-[45deg] font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--dark)]">
                  {item.step}
                </span>
              </span>

              <p className="mt-6 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-[var(--secondary)]">
                {item.duration}
              </p>
              <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-[var(--text-h3)]">
                {item.title}
              </h3>
              <p className="mt-3 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                {item.body}
              </p>

              <ul className="mt-5 space-y-2 border-t border-[var(--line)] pt-5">
                {item.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2.5 text-[var(--text-meta)] leading-relaxed text-[var(--ink-muted)]"
                  >
                    <span aria-hidden="true" className="mt-0.5 text-[var(--secondary)]">
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* ══ Submission form ═══════════════════════════════════════════════ */}
      <section id="submit" className="bg-[var(--surface-sunken)] py-14" aria-labelledby="submit-heading">
        <div className="shell grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow">Step one</p>
            <h2
              id="submit-heading"
              className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
            >
              Submit a work for assessment
            </h2>
            <hr className="rule-accent mt-4" />
            <p className="mt-5 max-w-[52ch] text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
              Everything in this form goes directly to the specialist who would catalogue the work.
              Nothing is published, and nothing leaves the building, until you have approved an
              estimate and a reserve in writing.
            </p>

            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--light)]">
              <Image
                src="/images/hero-gallery.jpg"
                alt="Works resting against the wall of the house saleroom awaiting assessment"
                fill
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="object-cover"
              />
            </div>

            <dl className="mt-8 space-y-4 border-t border-[var(--line)] pt-6">
              <div>
                <dt className="meta">Prefer to talk it through?</dt>
                <dd className="mt-1 text-[var(--text-body-min)] text-[var(--ink-muted)]">
                  <a
                    href={site.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
                  >
                    WhatsApp the house
                  </a>{' '}
                  or call{' '}
                  <a
                    href={`tel:${site.phone.replace(/\s/g, '')}`}
                    className="underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
                  >
                    {site.phone}
                  </a>
                  .
                </dd>
              </div>
              <div>
                <dt className="meta">Gallery address</dt>
                <dd className="mt-1 text-[var(--text-body-min)] text-[var(--ink-muted)]">
                  {site.address}
                </dd>
              </div>
              <div>
                <dt className="meta">Receiving works</dt>
                <dd className="mt-1 text-[var(--text-body-min)] text-[var(--ink-muted)]">
                  Tuesday to Friday, 10:00 – 17:00. Please telephone ahead for anything over 150 cm.
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-7">
            <SubmissionForm />
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="shell py-14" aria-labelledby="faq-heading">
        <p className="eyebrow">Questions</p>
        <h2
          id="faq-heading"
          className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
        >
          Before you consign
        </h2>
        <hr className="rule-accent mt-4" />

        <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {FAQ.map((item, index) => (
            <details key={item.q} className="group py-5" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 min-h-11">
                <h3 className="font-[family-name:var(--font-display)] text-[var(--text-h4)]">
                  {item.q}
                </h3>
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-[var(--secondary)] transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[68ch] text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/legal/terms" className="pill-btn pill-btn--ghost">
            Read the auction terms
          </Link>
          <Link href="/contact" className="pill-btn pill-btn--dark">
            Contact the house
          </Link>
        </div>
      </section>
    </>
  );
}
