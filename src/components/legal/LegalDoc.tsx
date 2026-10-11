import type { Metadata } from 'next';
import { createElement, type ReactNode } from 'react';

/**
 * Shared shell for the three statutory pages.
 *
 * The design source shipped no legal pages at all (DESIGN-INVENTORY.md §5), so
 * these layouts are authored to the brief and to the prose the brief specifies —
 * Kenya Data Protection Act 2019, 15% buyer's premium, Kenyan governing law. The
 * typography deliberately inherits the zip's tokens: display serif headings,
 * Roboto body at ≥15px, metadata at ≥11px.
 */

export interface LegalSection {
  id: string;
  heading: string;
  /** Rendered in order; a string becomes a paragraph, an array a list. */
  body: (string | ReactNode)[];
}

export function LegalDoc({
  title,
  intro,
  updated,
  sections,
  footer,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
  footer?: ReactNode;
}) {
  return (
    <div className="shell grid gap-12 py-12 lg:grid-cols-[240px_1fr] lg:gap-16">
      {/* ── Contents ────────────────────────────────────────────────────── */}
      <nav aria-label="On this page" className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)] lg:self-start">
        <p className="eyebrow">On this page</p>
        <ol className="mt-4 space-y-2 border-l border-[var(--line)] pl-4">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="flex gap-2 py-1 text-[var(--text-meta)] leading-snug text-[var(--ink-muted)] transition-colors duration-200 hover:text-[var(--dark)] hover:underline hover:decoration-2 hover:underline-offset-2"
              >
                <span className="text-[var(--ink-subtle)] [font-variant-numeric:tabular-nums]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── Document ───────────────────────────────────────────────────── */}
      <article className="max-w-[72ch]">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--text-display)] leading-tight">
          {title}
        </h1>
        <p className="mt-4 text-[var(--text-lead)] leading-relaxed text-[var(--ink-muted)]">{intro}</p>
        <p className="mt-4 border-y border-[var(--line)] py-3 text-[var(--text-meta)] text-[var(--ink-subtle)]">
          Last updated {updated} · Governed by the laws of Kenya
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-[calc(var(--nav-h)+1.5rem)]">
              <h2 className="font-[family-name:var(--font-display)] text-[var(--text-h3)]">
                <span className="mr-3 text-[var(--secondary)] [font-variant-numeric:tabular-nums]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.body.map((block, blockIndex) =>
                  typeof block === 'string' ? (
                    <p
                      key={blockIndex}
                      className="text-[var(--text-body-min)] leading-[1.7] text-[var(--ink-muted)]"
                    >
                      {block}
                    </p>
                  ) : Array.isArray(block) ? (
                    <ul key={blockIndex} className="space-y-2.5 pl-1">
                      {(block as ReactNode[]).map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex gap-3 text-[var(--text-body-min)] leading-[1.7] text-[var(--ink-muted)]"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--primary)]"
                          />
                          <span className="min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    createElement('div', { key: blockIndex }, block as ReactNode)
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        {footer ? <div className="mt-12 border-t border-[var(--line)] pt-8">{footer}</div> : null}

        <p className="mt-10 text-[11px] leading-relaxed text-[var(--ink-subtle)]">
          Lydia Auction House is a trading name registered in the Republic of Kenya. If anything in
          this document is unclear, write to our data protection contact at{' '}
          <a
            href="mailto:privacy@lydiaauctionhouse.co.ke"
            className="underline decoration-2 underline-offset-2"
          >
            privacy@lydiaauctionhouse.co.ke
          </a>{' '}
          and a person will answer you.
        </p>
      </article>
    </div>
  );
}

export const LEGAL_UPDATED = '11 October 2026';

export const metadataBase: Metadata = {
  alternates: { canonical: '/legal' },
};
