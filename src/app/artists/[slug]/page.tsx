import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { artists, getArtist } from '@/data/artists';
import { lotsByArtist } from '@/data/lots';
import { absoluteUrl, site } from '@/lib/site';
import { CATEGORY_LABELS } from '@/lib/types';
import { formatKES } from '@/lib/format';
import { LotCard } from '@/components/lots/LotCard';

/**
 * ARTIST PROFILE — /artists/[slug]
 *
 * ISR at 600 seconds, exactly as the brief specifies. An artist's biography and
 * exhibition history change a handful of times a year, so 10 minutes is a
 * comfortable freshness window and keeps the whole roster statically served.
 *
 * Every artist is pre-rendered at build time via `generateStaticParams`.
 */
export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return artists.map((artist) => ({ slug: artist.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtist(slug);
  if (!artist) return { title: 'Artist not found' };

  const description = `${artist.bio[0].slice(0, 155)}…`;

  return {
    title: artist.name,
    description,
    alternates: { canonical: `/artists/${artist.slug}` },
    openGraph: {
      type: 'profile',
      title: `${artist.name} — ${artist.medium}`,
      description,
      url: absoluteUrl(`/artists/${artist.slug}`),
      images: [
        {
          url: artist.portrait,
          width: 1024,
          height: 1024,
          alt: artist.portraitAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${artist.name} — ${artist.medium}`,
      description,
      images: [artist.portrait],
    },
  };
}

export default async function ArtistPage({ params }: PageProps) {
  const { slug } = await params;
  const artist = getArtist(slug);
  if (!artist) notFound();

  const works = lotsByArtist(artist.slug);
  const active = works.filter((lot) => lot.status === 'live' || lot.status === 'upcoming');
  const buyNow = works.filter((lot) => lot.status === 'buy-now');
  const sold = works.filter((lot) => lot.status === 'sold');

  return (
    <>
      <div className="bg-[var(--surface-ink)] text-white">
        <div className="shell py-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em] text-white/55">
              <li>
                <Link href="/" className="hover:text-[var(--primary)]">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/artists" className="hover:text-[var(--primary)]">
                  Artists
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--primary)]">{artist.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* ══ Profile header ════════════════════════════════════════════════ */}
      <header className="bg-[var(--surface-ink)] pb-12 text-white">
        <div className="shell grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-ink-raised)]">
            <Image
              src={artist.portrait}
              alt={artist.portraitAlt}
              fill
              priority
              sizes="(min-width: 1024px) 34vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="min-w-0">
            <p className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.2em] text-[var(--primary)]">
              {artist.disciplines.map((d) => CATEGORY_LABELS[d]).join(' · ')}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight text-white">
              {artist.name}
            </h1>
            <p className="mt-3 text-[var(--text-lead)] text-white/75">
              {artist.born} · {artist.location}, {artist.country}
            </p>

            <blockquote className="mt-7 border-l-4 border-[var(--primary)] pl-5 font-[family-name:var(--font-display)] text-[var(--text-h4)] italic leading-snug text-white">
              &ldquo;{artist.statement}&rdquo;
            </blockquote>

            <div className="mt-7 space-y-4">
              {artist.bio.map((paragraph, index) => (
                <p
                  key={index}
                  className="max-w-[68ch] text-[var(--text-body-min)] leading-relaxed text-white/72"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--line-ink)] pt-6">
              <div>
                <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/45">
                  Medium
                </dt>
                <dd className="mt-1 text-[var(--text-ui)]">{artist.medium}</dd>
              </div>
              <div>
                <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/45">
                  In catalogue
                </dt>
                <dd className="mt-1 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                  {works.length} works
                </dd>
              </div>
              <div>
                <dt className="font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.14em] text-white/45">
                  Sold at auction
                </dt>
                <dd className="mt-1 text-[var(--text-ui)] [font-variant-numeric:tabular-nums]">
                  {sold.length}
                </dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={`${site.whatsappLink.split('?')[0]}?text=${encodeURIComponent(
                  `Hello! I am interested in work by ${artist.name}. Could you tell me what is available?`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pill-btn pill-btn--primary"
              >
                Enquire about {artist.name.split(' ')[0]}
              </a>
              <Link href="/register" className="pill-btn pill-btn--ghost-invert">
                Register to Bid
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ══ Portfolio ═════════════════════════════════════════════════════ */}
      {active.length > 0 ? (
        <section className="shell py-12" aria-labelledby="active-lots-heading">
          <p className="eyebrow">Portfolio · at auction</p>
          <h2
            id="active-lots-heading"
            className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
          >
            {active.length} {active.length === 1 ? 'work' : 'works'} at auction now
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {active.map((lot, index) => (
              <li key={lot.id}>
                <LotCard lot={lot} priority={index < 4} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {buyNow.length > 0 ? (
        <section className="bg-[var(--surface-sunken)] py-12" aria-labelledby="buy-now-heading">
          <div className="shell">
            <p className="eyebrow">Portfolio · available now</p>
            <h2
              id="buy-now-heading"
              className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
            >
              Buy It Now
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {buyNow.map((lot) => (
                <li key={lot.id}>
                  <LotCard lot={lot} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ══ Exhibitions + awards ══════════════════════════════════════════ */}
      <section className="shell grid gap-12 py-12 lg:grid-cols-2" aria-labelledby="exhibitions-heading">
        <div>
          <h2 id="exhibitions-heading" className="eyebrow">
            Exhibition history
          </h2>
          <ol className="mt-5 space-y-4">
            {artist.exhibitions.map((exhibition) => (
              <li key={`${exhibition.year}-${exhibition.title}`} className="flex gap-5 border-b border-[var(--line)] pb-4">
                <span className="w-14 shrink-0 font-[family-name:var(--font-condensed)] text-[var(--text-ui)] text-[var(--secondary)] [font-variant-numeric:tabular-nums]">
                  {exhibition.year}
                </span>
                <span className="min-w-0">
                  <span className="block font-[family-name:var(--font-display)] text-[var(--text-ui)]">
                    {exhibition.title}
                  </span>
                  <span className="block text-[var(--text-meta)] text-[var(--ink-muted)]">
                    {exhibition.venue}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          {artist.awards && artist.awards.length > 0 ? (
            <>
              <h2 className="eyebrow">Awards and recognition</h2>
              <ul className="mt-5 space-y-3">
                {artist.awards.map((award) => (
                  <li
                    key={award}
                    className="flex gap-3 text-[var(--text-body-min)] text-[var(--ink-muted)]"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--primary)]"
                    />
                    {award}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h2 className="eyebrow mt-10">Enquiries</h2>
          <p className="mt-3 max-w-[52ch] text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
            We hold a small number of additional works by {artist.name} that are not catalogued. If
            you are looking for a specific period, size or palette, tell us and we will come back to
            you.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/contact" className="pill-btn pill-btn--dark">
              Private sale enquiry
            </Link>
            <a
              href={site.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-btn pill-btn--ghost"
            >
              WhatsApp the house
            </a>
          </div>
        </div>
      </section>

      {/* ══ Sold archive ══════════════════════════════════════════════════ */}
      {sold.length > 0 ? (
        <section className="bg-[var(--surface-sunken)] py-12" aria-labelledby="sold-heading">
          <div className="shell">
            <p className="eyebrow">Archive</p>
            <h2
              id="sold-heading"
              className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h2)]"
            >
              Sold at auction
            </h2>
            <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)]">
              <table className="results-table">
                <caption className="sr-only">
                  Works by {artist.name} sold at Lydia Auction House, with hammer prices
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Lot</th>
                    <th scope="col">Work</th>
                    <th scope="col">Year</th>
                    <th scope="col">Estimate (KES)</th>
                    <th scope="col">Hammer (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {sold.map((lot) => (
                    <tr key={lot.id}>
                      <td className="[font-variant-numeric:tabular-nums]">{lot.lotNumber}</td>
                      <td>
                        <Link
                          href={`/lots/${lot.slug}`}
                          className="underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
                        >
                          {lot.title}
                        </Link>
                      </td>
                      <td className="text-[var(--ink-muted)]">{lot.year}</td>
                      <td className="text-[var(--ink-muted)] [font-variant-numeric:tabular-nums]">
                        {formatKES(lot.estimateLow)} – {formatKES(lot.estimateHigh)}
                      </td>
                      <td className="font-semibold [font-variant-numeric:tabular-nums]">
                        {lot.soldPrice ? formatKES(lot.soldPrice) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link href={`/results?artist=${artist.slug}`} className="pill-btn pill-btn--ghost mt-5">
              All results for {artist.name}
            </Link>
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: artist.name,
            description: artist.bio[0],
            image: absoluteUrl(artist.portrait),
            url: absoluteUrl(`/artists/${artist.slug}`),
            jobTitle: 'Artist',
            nationality: artist.country,
            knowsAbout: artist.disciplines.map((d) => CATEGORY_LABELS[d]),
            workLocation: { '@type': 'Place', name: `${artist.location}, ${artist.country}` },
            award: artist.awards ?? [],
          }),
        }}
      />
    </>
  );
}
