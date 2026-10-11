import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { artists } from '@/data/artists';
import { lots, lotsByArtist } from '@/data/lots';
import { CATEGORY_LABELS } from '@/lib/types';
import { initials, pluralise } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Artists',
  description:
    'The East African artists represented by Lydia Auction House — painters, sculptors, photographers, jewellers, weavers and ceramicists from Kenya, Uganda, Tanzania and Ethiopia.',
  alternates: { canonical: '/artists' },
};

export const dynamic = 'force-dynamic';

export default function ArtistsPage() {
  const countries = Array.from(new Set(artists.map((artist) => artist.country))).sort();

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--surface-sunken)]">
        <div className="shell py-10 md:py-14">
          <p className="eyebrow">Represented artists</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
            The artists
          </h1>
          <p className="lead mt-4 max-w-[64ch]">
            {artists.length} artists across {countries.length} countries and{' '}
            {new Set(artists.flatMap((a) => a.disciplines)).size} disciplines. Every work we
            catalogue is consigned directly by the artist, their estate, or a documented private
            collection.
          </p>
          <p className="meta mt-5">{countries.join(' · ')}</p>
        </div>
      </header>

      <section className="shell py-12">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => {
            const works = lotsByArtist(artist.slug);
            const live = works.filter((lot) => lot.status === 'live');
            const sold = works.filter((lot) => lot.status === 'sold');

            return (
              <li key={artist.slug}>
                <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] transition-shadow duration-[260ms] hover:shadow-[var(--shadow-md)]">
                  <Link
                    href={`/artists/${artist.slug}`}
                    className="group relative block aspect-[4/3] overflow-hidden bg-[var(--light)] focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--dark)]"
                  >
                    <Image
                      src={artist.portrait}
                      alt={artist.portraitAlt}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover transition-transform duration-[400ms] ease-[var(--ease-out)] group-hover:scale-[1.04] motion-reduce:transform-none"
                    />
                    {live.length > 0 ? (
                      <span className="chip chip--live absolute left-3 top-3">
                        <span className="live-dot" aria-hidden="true" />
                        {pluralise(live.length, 'lot')} live
                      </span>
                    ) : null}
                  </Link>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--primary)] font-[family-name:var(--font-condensed)] text-[13px] font-bold text-[var(--dark)]"
                      >
                        {initials(artist.name)}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-[family-name:var(--font-display)] text-[var(--text-h4)] leading-tight">
                          <Link
                            href={`/artists/${artist.slug}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {artist.name}
                          </Link>
                        </h2>
                        <p className="meta mt-0.5">
                          {artist.location}, {artist.country}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-[var(--text-meta)] text-[var(--ink-muted)]">
                      {artist.medium}
                    </p>

                    <p className="mt-3 text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
                      {artist.bio[0].slice(0, 180)}…
                    </p>

                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {artist.disciplines.map((discipline) => (
                        <li
                          key={discipline}
                          className="rounded-[var(--radius-pill)] bg-[var(--light)] px-2.5 py-1 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-muted)]"
                        >
                          {CATEGORY_LABELS[discipline]}
                        </li>
                      ))}
                    </ul>

                    <dl className="mt-4 flex gap-6 border-t border-[var(--line)] pt-4 text-[var(--text-meta)]">
                      <div>
                        <dt className="text-[var(--ink-subtle)]">In catalogue</dt>
                        <dd className="[font-variant-numeric:tabular-nums]">{works.length}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--ink-subtle)]">Sold</dt>
                        <dd className="[font-variant-numeric:tabular-nums]">{sold.length}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--ink-subtle)]">Since</dt>
                        <dd>{artist.exhibitions.at(-1)?.year ?? '—'}</dd>
                      </div>
                    </dl>

                    <Link href={`/artists/${artist.slug}`} className="pill-btn pill-btn--ghost mt-5 w-full">
                      View profile and works
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <div className="mt-12 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-8 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-[var(--text-h3)]">
            Are you an artist working in East Africa?
          </h2>
          <p className="mx-auto mt-2 max-w-[52ch] text-[var(--text-body-min)] text-[var(--ink-muted)]">
            We review every submission, and we represent {lots.length > 0 ? 'emerging and established' : ''}{' '}
            artists on the same terms. Send us three photographs and a description and one of our
            specialists will come back to you within three working days.
          </p>
          <Link href="/sell#submit" className="pill-btn pill-btn--dark mt-5">
            Submit your work
          </Link>
        </div>
      </section>
    </>
  );
}
