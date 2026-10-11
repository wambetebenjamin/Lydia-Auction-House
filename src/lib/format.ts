/**
 * Formatting helpers. The house trades in Kenyan Shillings exclusively, so
 * currency formatting is centralised here and never inlined.
 */

const KES = new Intl.NumberFormat('en-KE', {
  maximumFractionDigits: 0,
});

/** `1250000` → `"KES 1,250,000"` */
export function formatKES(amount: number): string {
  return `KES ${KES.format(Math.round(amount))}`;
}

/** `1250000` → `"KES 1.25M"` — for tight rails and cards. */
export function formatKESCompact(amount: number): string {
  const n = Math.round(amount);
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `KES ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `KES ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`;
  }
  return `KES ${KES.format(n)}`;
}

/** `"KES 400,000 – 700,000"` */
export function formatEstimate(low: number, high: number): string {
  return `${formatKES(low)} – ${formatKES(high)}`;
}

export function formatNumber(n: number): string {
  return KES.format(n);
}

/** Bid increments scale with the lot value, the way a real saleroom does. */
export function bidIncrement(currentBid: number): number {
  if (currentBid < 50_000) return 5_000;
  if (currentBid < 150_000) return 10_000;
  if (currentBid < 500_000) return 25_000;
  if (currentBid < 1_500_000) return 50_000;
  if (currentBid < 5_000_000) return 100_000;
  return 250_000;
}

export function nextBidAmount(currentBid: number): number {
  return currentBid + bidIncrement(currentBid);
}

/** "Lot 012" */
export function lotLabel(lotNumber: string): string {
  return `Lot ${lotNumber}`;
}

const DATE_TZ = 'Africa/Nairobi';

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: DATE_TZ,
    ...opts,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DATE_TZ,
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DATE_TZ,
  }).format(new Date(iso));
}

/** Screen-reader / metadata friendly short date — "24 Oct 2026". */
export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: DATE_TZ,
  }).format(new Date(iso));
}

/** Relative-to-now label used on auction cards. */
export function relativeDayLabel(iso: string, from: Date = new Date()): string {
  const target = new Date(iso);
  const days = Math.round((target.getTime() - from.getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1 && days < 7) return `In ${days} days`;
  if (days < -1 && days > -7) return `${Math.abs(days)} days ago`;
  return formatDateShort(iso);
}

/**
 * Countdown broken into parts. Returns `null` for elapsed targets so callers
 * can render a closed state rather than a negative clock.
 */
export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  elapsed: boolean;
}

export function countdown(target: string | number | Date, from: number = Date.now()): CountdownParts {
  const t = new Date(target).getTime();
  const total = t - from;
  const elapsed = total <= 0;
  const abs = Math.max(0, total);
  return {
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs / 3_600_000) % 24),
    minutes: Math.floor((abs / 60_000) % 60),
    seconds: Math.floor((abs / 1000) % 60),
    total,
    elapsed,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `"02:14:33"` — the navbar ticker format required by the brief. */
export function formatCountdownClock(target: string | number | Date, from?: number): string {
  const c = countdown(target, from);
  const hh = c.days * 24 + c.hours;
  return `${pad(hh)}:${pad(c.minutes)}:${pad(c.seconds)}`;
}

/** `"2d 02:14:33"` — used once a countdown runs past a day. */
export function formatCountdownVerbose(target: string | number | Date, from?: number): string {
  const c = countdown(target, from);
  if (c.days > 0) return `${c.days}d ${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
  return `${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
}

/** Spoken form for live regions — "2 days, 14 hours, 33 seconds". */
export function spokenCountdown(target: string | number | Date, from?: number): string {
  const c = countdown(target, from);
  if (c.elapsed) return 'closed';
  const parts: string[] = [];
  if (c.days) parts.push(`${c.days} day${c.days === 1 ? '' : 's'}`);
  if (c.hours) parts.push(`${c.hours} hour${c.hours === 1 ? '' : 's'}`);
  if (c.minutes) parts.push(`${c.minutes} minute${c.minutes === 1 ? '' : 's'}`);
  if (!c.days && !c.hours) parts.push(`${c.seconds} second${c.seconds === 1 ? '' : 's'}`);
  return parts.join(', ');
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
