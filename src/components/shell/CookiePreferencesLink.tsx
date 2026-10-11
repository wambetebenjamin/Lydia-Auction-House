'use client';

/**
 * Reopens the cookie manager after a choice has been recorded.
 * Kenya Data Protection Act 2019 requires consent to be withdrawable as easily
 * as it was given, so this control lives permanently in the footer.
 */

import { openCookiePreferences } from './CookieConsent';

interface CookiePreferencesLinkProps {
  className?: string;
  label?: string;
}

export function CookiePreferencesLink({
  className = '',
  label = 'Cookie preferences',
}: CookiePreferencesLinkProps) {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className={
        className ||
        'inline-flex min-h-11 items-center font-semibold underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)]'
      }
    >
      {label}
    </button>
  );
}
