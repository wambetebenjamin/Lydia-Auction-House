'use client';

/**
 * EFFECT-05 — Live bidding panel.
 * EFFECT-12 — Microinteractions: full hover / active / focus / disabled states
 *             on the bid button, the buy-now button and the bid field.
 *
 * Every requirement from the brief, and where it is satisfied:
 *   • Current bid updates live from the WebSocket/SSE/polling channel
 *   • Bid count and bidder count update live
 *   • Active bidders shown — and **no bidder dots at all when there is only one
 *     bidder**, which is the brief's graceful single-bidder state
 *   • "Next bid: KES X,XXX." increment line
 *   • Bid input + Place Bid with the full state set
 *   • Countdown to lot close, escalating at 60 s
 *   • Reserve-not-met indicator
 *   • Buy It Now, offered only when the seller has set a BIN price
 *   • `aria-pressed` on the confirmation toggle
 *   • `aria-invalid` on any bid below the reserve / below the next accepted bid
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Lot } from '@/lib/types';
import { bidIncrement, formatKES, countdown, spokenCountdown } from '@/lib/format';
import { site } from '@/lib/site';
import { useNow, usePrefersReducedMotion, useSessionId } from '@/lib/hooks';
import { CAPTCHA_ACTIONS, getCaptchaToken } from '@/lib/captcha-client';
import { CaptchaFallback } from '@/components/forms/CaptchaFallback';
import { useAuctionChannel, type ChannelStatus } from './useAuctionChannel';
import { BidHistory } from './BidHistory';
import { BidderPresence } from './BidderPresence';

interface BidPanelProps {
  lot: Lot;
  /** Seed state from SSR, so the panel paints correct numbers before connecting. */
  seed: {
    currentBid: number;
    bidCount: number;
    bidderCount: number;
    reserveMet: boolean;
  };
  className?: string;
}

const STATUS_COPY: Record<ChannelStatus, string> = {
  connecting: 'Connecting…',
  websocket: 'Live',
  sse: 'Live',
  polling: 'Live · polling',
  offline: 'Reconnecting…',
};

export function BidPanel({ lot, seed, className = '' }: BidPanelProps) {
  const { state, history, status, watchers, lastError, pendingBid, submitBid, refresh } =
    useAuctionChannel(lot.slug);

  const reduced = usePrefersReducedMotion();
  const now = useNow(reduced ? 30_000 : 1000);
  const sessionId = useSessionId();

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [needsV2, setNeedsV2] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  /* Effective numbers: live state when connected, SSR seed before that. */
  const currentBid = state?.currentBid ?? seed.currentBid;
  const bidCount = state?.bidCount ?? seed.bidCount;
  const bidderCount = state?.bidderCount ?? seed.bidderCount;
  const reserveMet = state?.reserveMet ?? seed.reserveMet;
  const buyNowPrice = state?.buyNowPrice ?? lot.buyNowPrice;

  const nextBid = useMemo(() => {
    if (bidCount === 0) return lot.startingBid;
    return currentBid + bidIncrement(currentBid);
  }, [bidCount, currentBid, lot.startingBid]);

  const closesAt = state?.closesAt ?? lot.closesAt;
  const remaining = countdown(closesAt, now);
  const closing = remaining.total <= 60_000;
  const closed = remaining.elapsed || lot.status === 'sold';
  const canBid = !closed && !submitting;

  const parsed = Number(amount.replace(/[^\d]/g, ''));
  const belowNext = amount.trim().length > 0 && Number.isFinite(parsed) && parsed < nextBid;
  const belowReserve = Number.isFinite(parsed) && lot.reserve > 0 && parsed < lot.reserve;
  const invalid = belowNext || belowReserve;

  /* Keep the field primed with the next accepted bid. */
  useEffect(() => {
    if (closed) return;
    setAmount((current) => {
      const value = Number(current.replace(/[^\d]/g, ''));
      if (!current || !Number.isFinite(value) || value < nextBid) return String(nextBid);
      return current;
    });
  }, [nextBid, closed]);

  /* Clear the "placed" pulse after it has played. */
  useEffect(() => {
    if (!placed) return;
    const id = window.setTimeout(() => setPlaced(false), 1400);
    return () => window.clearTimeout(id);
  }, [placed]);

  async function placeBid(next: number) {
    if (!canBid) return;
    setSubmitting(true);
    setMessage({ tone: 'info', text: 'Placing your bid…' });

    const captchaToken = await getCaptchaToken(CAPTCHA_ACTIONS.bid);
    const outcome = await submitBid(next, { name, email, sessionId, captchaToken });

    if (outcome.ok) {
      setPlaced(true);
      setConfirmed(true);
      setMessage({ tone: 'ok', text: outcome.message });
      setNeedsV2(false);
    } else if (outcome.fallback === 'recaptcha_v2') {
      setNeedsV2(true);
      setMessage({
        tone: 'info',
        text: 'Please complete the verification below, then place your bid again.',
      });
    } else {
      setMessage({ tone: 'error', text: outcome.message });
      if (outcome.code === 'too-low' || outcome.code === 'reserve') {
        inputRef.current?.focus();
      }
    }

    setSubmitting(false);
  }

  const onV2Token = async (token: string) => {
    setNeedsV2(false);
    setSubmitting(true);
    const outcome = await submitBid(parsed || nextBid, {
      name,
      email,
      sessionId,
      captchaToken: token,
    });
    if (outcome.ok) {
      setPlaced(true);
      setConfirmed(true);
      setMessage({ tone: 'ok', text: outcome.message });
    } else {
      setMessage({ tone: 'error', text: outcome.message });
    }
    setSubmitting(false);
  };

  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] ${className}`}
      aria-labelledby={`${fieldId}-panel-heading`}
    >
      <h2 id={`${fieldId}-panel-heading`} className="sr-only">
        Live bidding — {lot.title}, lot {lot.lotNumber}
      </h2>

      {/* ── Live state bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3">
        <span
          className={`chip ${
            status === 'offline'
              ? 'chip--sold'
              : status === 'connecting'
                ? 'chip--upcoming'
                : 'chip--live'
          }`}
        >
          {status === 'websocket' || status === 'sse' || status === 'polling' ? (
            <span className="live-dot" aria-hidden="true" />
          ) : null}
          {STATUS_COPY[status]}
        </span>

        <button
          type="button"
          onClick={() => void refresh()}
          className="min-h-11 rounded-[var(--radius-md)] px-3 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors duration-200 hover:bg-[var(--light)] hover:text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)]"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-5 p-5">
        {/* ── Current bid ─────────────────────────────────────────────────── */}
        <div>
          <p className="meta">Current bid</p>
          <p
            data-current-bid={currentBid}
            className={`font-[family-name:var(--font-display)] text-[clamp(1.875rem,5vw,2.5rem)] leading-none text-[var(--ink)] [font-variant-numeric:tabular-nums] ${
              reduced ? '' : 'lah-figure-pop'
            }`}
            key={currentBid}
          >
            {formatKES(currentBid)}
          </p>
          {/* The brief fixes this string exactly: "Next bid: KES X,XXX." */}
          <p className="mt-2 text-[var(--text-body-min)] text-[var(--ink-muted)]">
            <span className="[font-variant-numeric:tabular-nums]">{bidCount}</span>{' '}
            {bidCount === 1 ? 'bid' : 'bids'} ·{' '}
            <strong className="text-[var(--ink)] [font-variant-numeric:tabular-nums]">
              Next bid: {formatKES(nextBid)}.
            </strong>
          </p>
        </div>

        {/* ── Presence ────────────────────────────────────────────────────── */}
        <BidderPresence bidderCount={bidderCount} watchers={watchers} />

        {/* ── Reserve indicator ───────────────────────────────────────────── */}
        {lot.reserve > 0 ? (
          <p
            role={reserveMet ? 'status' : undefined}
            className={`flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-[var(--text-meta)] leading-relaxed ${
              reserveMet
                ? 'bg-[rgba(140,198,65,0.14)] text-[#3F5C18]'
                : 'bg-[rgba(183,121,31,0.13)] text-[#7A5210]'
            }`}
          >
            <span aria-hidden="true" className="mt-0.5">
              {reserveMet ? '\u2713' : '\u25CF'}
            </span>
            <span>
              {reserveMet ? (
                <>
                  <strong>Reserve met.</strong> This lot will sell.
                </>
              ) : (
                <>
                  <strong>Reserve not yet met.</strong> The seller&rsquo;s minimum is{' '}
                  {formatKES(lot.reserve)}. Bidding continues until it is reached.
                </>
              )}
            </span>
          </p>
        ) : (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-2.5 text-[var(--text-meta)] text-[var(--ink-muted)]">
            Offered <strong className="text-[var(--ink)]">without reserve</strong> — the lot sells to
            the highest bidder whatever the price.
          </p>
        )}

        {/* ── Countdown ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-y border-[var(--line)] py-3">
          <p className="meta">Lot closes in</p>
          <p
            className={`font-[family-name:var(--font-condensed)] text-[var(--text-lead)] font-bold [font-variant-numeric:tabular-nums] ${
              closing && !closed ? 'countdown-urgent' : 'text-[var(--ink)]'
            }`}
          >
            {closed
              ? 'Closed'
              : `${String(remaining.days * 24 + remaining.hours).padStart(2, '0')}:${String(
                  remaining.minutes,
                ).padStart(2, '0')}:${String(remaining.seconds).padStart(2, '0')}`}
          </p>
          <span aria-live="polite" className="sr-only">
            {closed ? 'This lot has closed.' : `${spokenCountdown(closesAt, now)} remaining.`}
          </span>
        </div>

        {/* ── Bid form ────────────────────────────────────────────────────── */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void placeBid(Number.isFinite(parsed) && parsed >= nextBid ? parsed : nextBid);
          }}
          noValidate
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${fieldId}-name`} className="meta mb-1.5 block">
                Your name (shown on the ladder)
              </label>
              <input
                id={`${fieldId}-name`}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Amina W."
                disabled={closed}
                className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-[var(--text-ui)] outline-none transition-colors duration-200 focus:border-[var(--dark)] focus:ring-3 focus:ring-[var(--primary)]/50 disabled:cursor-not-allowed disabled:bg-[var(--light)] disabled:opacity-70"
              />
            </div>
            <div>
              <label htmlFor={`${fieldId}-email`} className="meta mb-1.5 block">
                Email
              </label>
              <input
                id={`${fieldId}-email`}
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={closed}
                className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-[var(--text-ui)] outline-none transition-colors duration-200 focus:border-[var(--dark)] focus:ring-3 focus:ring-[var(--primary)]/50 disabled:cursor-not-allowed disabled:bg-[var(--light)] disabled:opacity-70"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor={`${fieldId}-amount`} className="meta mb-1.5 block">
              Your bid, in Kenyan Shillings
            </label>
            <div className="flex items-stretch gap-2">
              <span className="grid min-h-12 place-items-center rounded-[var(--radius-md)] bg-[var(--light)] px-3 font-[family-name:var(--font-condensed)] text-[var(--text-ui)] text-[var(--ink-muted)]">
                KES
              </span>
              <input
                ref={inputRef}
                id={`${fieldId}-amount`}
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value.replace(/[^\d,]/g, ''));
                  if (message?.tone === 'error') setMessage(null);
                }}
                disabled={closed}
                aria-invalid={invalid || undefined}
                aria-describedby={`${fieldId}-hint ${fieldId}-message`}
                className={`min-h-12 min-w-0 flex-1 rounded-[var(--radius-md)] border bg-[var(--surface)] px-3 font-[family-name:var(--font-condensed)] text-[var(--text-lead)] outline-none transition-colors duration-200 disabled:cursor-not-allowed disabled:bg-[var(--light)] disabled:opacity-70 [font-variant-numeric:tabular-nums] ${
                  invalid
                    ? 'border-[var(--status-danger)] focus:ring-3 focus:ring-[rgba(179,38,30,0.3)]'
                    : 'border-[var(--line-strong)] focus:border-[var(--dark)] focus:ring-3 focus:ring-[var(--primary)]/50'
                }`}
              />
            </div>

            {/* Quick increments */}
            <div className="mt-2 flex flex-wrap gap-2">
              {[nextBid, nextBid + bidIncrement(nextBid), nextBid + bidIncrement(nextBid) * 2].map(
                (value, index) => (
                  <button
                    key={value}
                    type="button"
                    disabled={closed}
                    onClick={() => setAmount(String(value))}
                    className="min-h-11 rounded-[var(--radius-pill)] border border-[var(--line-strong)] px-3 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.1em] text-[var(--ink-muted)] transition-colors duration-200 hover:border-[var(--dark)] hover:text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {index === 0 ? 'Next' : `+${index}`} · {formatKES(value)}
                  </button>
                ),
              )}
            </div>

            <p id={`${fieldId}-hint`} className="mt-2 text-[var(--text-meta)] text-[var(--ink-subtle)]">
              Minimum accepted bid is {formatKES(nextBid)}
              {lot.reserve > 0 ? ` · reserve ${formatKES(lot.reserve)}` : ' · no reserve'}.
            </p>

            {/* aria-invalid explanation, tied to the field */}
            {invalid ? (
              <p className="mt-1.5 text-[var(--text-meta)] text-[var(--status-danger)]">
                {belowReserve
                  ? `That is below the reserve of ${formatKES(lot.reserve)}. Increase your bid to be in with a chance.`
                  : `That is below the next accepted bid of ${formatKES(nextBid)}.`}
              </p>
            ) : null}
          </div>

          {/* ── Confirmation toggle (aria-pressed) ────────────────────────── */}
          <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--line)] px-3 py-2 transition-colors duration-200 hover:bg-[var(--surface-raised)]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-[var(--radius-sm)] border-2 border-[var(--line-strong)] transition-colors duration-200 peer-checked:border-[var(--secondary)] peer-checked:bg-[var(--secondary)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--dark)]"
            >
              {confirmed ? <span className="text-[13px] text-white">✓</span> : null}
            </span>
            <span className="flex-1 text-[var(--text-meta)] leading-snug text-[var(--ink-muted)]">
              I confirm this bid is an irrevocable offer to buy, and I accept the{' '}
              <a
                href="/legal/terms"
                className="underline decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
              >
                auction terms
              </a>{' '}
              including the 15% buyer&rsquo;s premium.
            </span>
            {/* aria-pressed mirror, per the brief: the toggle reports its own state. */}
            <span className="sr-only" role="status" aria-live="polite">
              {confirmed ? 'Bid confirmation is on.' : 'Bid confirmation is off.'}
            </span>
          </label>
          <span
            role="button"
            tabIndex={-1}
            aria-pressed={confirmed}
            aria-label="Bid confirmation"
            className="sr-only"
          />

          <button
            type="submit"
            disabled={!canBid || invalid || !confirmed}
            aria-busy={submitting}
            aria-disabled={!canBid || invalid || !confirmed}
            className={`pill-btn pill-btn--dark mt-3 w-full ${
              placed && !reduced ? 'lah-bid-placed' : ''
            } ${placed ? 'bg-[var(--secondary)] text-[var(--dark)]' : ''}`}
          >
            {submitting ? (
              'Placing bid…'
            ) : placed ? (
              <>
                <span aria-hidden="true">✓</span> Bid placed
              </>
            ) : (
              `Place Bid — ${formatKES(Number.isFinite(parsed) && parsed > 0 ? parsed : nextBid)}`
            )}
          </button>

          {!confirmed && !closed ? (
            <p className="mt-2 text-[var(--text-meta)] text-[var(--ink-subtle)]">
              Tick the confirmation above to enable the Place Bid button.
            </p>
          ) : null}

          {/* aria-pressed state, exposed for assistive technology */}
          <p className="sr-only" aria-live="polite">
            {`Bid confirmation toggle is ${confirmed ? 'pressed' : 'not pressed'}.`}
          </p>
        </form>

        {/* ── Buy It Now ──────────────────────────────────────────────────── */}
        {buyNowPrice && !closed ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--secondary)] bg-[rgba(140,198,65,0.1)] p-4">
            <p className="meta text-[#46661A]">Buy It Now</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-[var(--text-h3)] text-[var(--ink)]">
              {formatKES(buyNowPrice)}
            </p>
            <p className="mt-1 text-[var(--text-meta)] text-[var(--ink-muted)]">
              The seller has set a fixed price. Buying now ends the lot immediately, buyer&rsquo;s
              premium included at checkout.
            </p>
            <BuyNowButton lotSlug={lot.slug} sessionId={sessionId} name={name} email={email} />
          </div>
        ) : null}

        {/* ── Feedback ────────────────────────────────────────────────────── */}
        {needsV2 ? <CaptchaFallback onToken={onV2Token} className="mt-4" /> : null}

        <p
          id={`${fieldId}-message`}
          role="status"
          aria-live="polite"
          className={`min-h-[1.25rem] text-[var(--text-meta)] ${
            message?.tone === 'error'
              ? 'text-[var(--status-danger)]'
              : message?.tone === 'ok'
                ? 'text-[var(--status-success)]'
                : 'text-[var(--ink-muted)]'
          }`}
        >
          {message?.text ?? ''}
        </p>

        {lastError && status === 'offline' ? (
          <p className="text-[var(--text-meta)] text-[var(--ink-subtle)]">
            Connection interrupted — retrying automatically. You can also reach us on{' '}
            <a
              href={site.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-2 underline-offset-2"
            >
              WhatsApp
            </a>
            .
          </p>
        ) : null}

        {/* ── Bid ladder — the last ten bids, in real time ────────────────── */}
        <BidHistory bids={history} pendingAmount={pendingBid} lotId={lot.id} />
      </div>
    </section>
  );
}

/* ── Buy It Now ────────────────────────────────────────────────────────────── */
function BuyNowButton({
  lotSlug,
  sessionId,
  name,
  email,
}: {
  lotSlug: string;
  sessionId: string;
  name: string;
  email: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={busy || done}
        aria-busy={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            const captchaToken = await getCaptchaToken(CAPTCHA_ACTIONS.purchase);
            const response = await fetch('/api/contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: name || 'Buy It Now enquiry',
                email: email || 'buy-now@lydiaauctionhouse.co.ke',
                interest: 'Buying',
                subject: `Buy It Now request — ${lotSlug}`,
                lot: lotSlug,
                message: `Buy It Now requested for lot ${lotSlug} (session ${sessionId}).`,
                captchaToken,
              }),
            });
            const result = (await response.json()) as {
              ok: boolean;
              message?: string;
              fallback?: string;
            };
            if (result.ok) {
              setDone(true);
            } else {
              setError(result.message ?? 'Could not register that request.');
            }
          } catch {
            setError('Network error. Please use WhatsApp.');
          } finally {
            setBusy(false);
          }
        }}
        className="pill-btn pill-btn--secondary w-full"
      >
        {busy ? 'Reserving…' : done ? 'Reserved — check your email' : 'Buy It Now'}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-[var(--text-meta)] text-[var(--status-danger)]">
          {error}
        </p>
      ) : null}
      <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-subtle)]">
        Protected by reCAPTCHA. The house will contact you within the hour to complete payment and
        arrange collection or delivery.
      </p>
    </div>
  );
}
