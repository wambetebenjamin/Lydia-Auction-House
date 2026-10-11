import type { Metadata } from 'next';
import { LegalDoc, LEGAL_UPDATED, type LegalSection } from '@/components/legal/LegalDoc';
import { CookiePreferencesLink } from '@/components/shell/CookiePreferencesLink';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Every cookie and localStorage key this site sets, what it does, how long it lasts, and how to change your mind. Kenya Data Protection Act 2019 compliant.',
  alternates: { canonical: '/legal/cookie-policy' },
};

export const revalidate = 3600;

const STORAGE = [
  {
    name: 'lah:cookie-consent',
    type: 'localStorage',
    purpose:
      'Remembers the choice you made in the cookie banner — Accept All, or a custom set from Manage Preferences — so the banner does not reappear on every page.',
    lifetime: 'Until you clear your browser storage',
    group: 'Necessary',
  },
  {
    name: 'lah:session',
    type: 'localStorage',
    purpose:
      'An anonymous random identifier that keeps your bidder session stable while you bid, and lets the saleroom show you the right paddle. Contains no personal data.',
    lifetime: '12 hours from last use',
    group: 'Necessary',
  },
  {
    name: 'lah:bidder',
    type: 'localStorage',
    purpose:
      'Stores the paddle number you were issued at registration, plus your display name, so the auction room greets you by paddle without a login.',
    lifetime: 'Until you clear it, or ask us to close your registration',
    group: 'Necessary',
  },
  {
    name: 'lah:view-mode',
    type: 'localStorage',
    purpose:
      'Remembers whether you prefer the catalogue as a flipbook or in text reading mode, and the page you reached.',
    lifetime: '1 year',
    group: 'Functional',
  },
  {
    name: 'lah:recent-lots',
    type: 'localStorage',
    purpose:
      'A short list of the lots you have looked at, used to keep the "recently viewed" rail relevant. Stored only on your device.',
    lifetime: '30 days',
    group: 'Functional',
  },
  {
    name: '_vercel_jwt / __Host-next-auth',
    type: 'Cookie',
    purpose:
      'Set by the hosting platform for internal routing and security of the deployment. Carries no bidder data.',
    lifetime: 'Session',
    group: 'Necessary',
  },
  {
    name: '_GRECAPTCHA',
    type: 'Cookie (third party)',
    purpose:
      'Set by Google reCAPTCHA when a public form or the bid endpoint asks for a bot-check. We use reCAPTCHA v3 invisibly, and only fall back to the visible v2 checkbox if a request scores below 0.5.',
    lifetime: 'Up to 6 months',
    group: 'Necessary',
  },
  {
    name: 'Analytics cookies',
    type: 'Cookie (third party)',
    purpose:
      'Would be set only if you switch Analytics on. They would tell us which lots are read and where readers come from. Nothing is set while Analytics is off.',
    lifetime: '13 months',
    group: 'Analytics',
  },
  {
    name: 'Marketing cookies',
    type: 'Cookie (third party)',
    purpose:
      'Would be set only if you switch Marketing on, to measure whether a campaign led to a bid. Nothing is set while Marketing is off.',
    lifetime: '13 months',
    group: 'Marketing',
  },
] as const;

const GROUP_STYLES: Record<string, string> = {
  Necessary: 'bg-[var(--dark)] text-[var(--primary)]',
  Functional: 'bg-[var(--secondary)] text-[#22330C]',
  Analytics: 'bg-[var(--primary)] text-[var(--dark)]',
  Marketing: 'bg-[var(--light)] text-[var(--ink-muted)] border border-[var(--line-strong)]',
};

const sections: LegalSection[] = [
  {
    id: 'what-they-are',
    heading: 'Cookies and browser storage',
    body: [
      'A cookie is a small text file a site asks your browser to keep. Browser storage — localStorage and sessionStorage — is similar, but the data stays on your device and is never attached to a request unless the site reads it in JavaScript. This site uses both, and the table below lists every one of them.',
      'We do not use cookies to build advertising profiles of you, and we do not sell data. Our strictly necessary items exist to make bidding work at all: without them the saleroom cannot tell one bidder from another, and you would not be able to place a bid.',
    ],
  },
  {
    id: 'categories',
    heading: 'The four categories',
    body: [
      [
        'Necessary — locked on, and cannot be switched off. They keep your session, remember your cookie choice, protect forms from bots and keep the platform secure.',
        'Functional — optional. They remember preferences such as flipbook or text reading mode, and the lots you looked at recently.',
        'Analytics — optional, and off unless you switch them on. They would tell us which lots are read, how long a visit lasts and where readers arrive from.',
        'Marketing — optional, and off unless you switch them on. They would measure whether an advertising campaign led to a bid, and would be set by the advertising platform.',
      ],
      'We use a consent-before-set model. No cookie or storage key outside the Necessary group is written until you have chosen, and if you accept everything and later change your mind, we remove what we set.',
    ],
  },
  {
    id: 'your-choice',
    heading: 'How to change your mind',
    body: [
      'You can revisit your choice at any time from the "Cookie preferences" link in the footer of every page, which reopens the banner and its Manage Preferences panel with your current settings already selected. Saving again takes effect immediately and removes anything you have switched off.',
      'You can also clear cookies and site data in your browser settings. Deleting the "lah:cookie-consent" key is exactly the same as never having chosen: the banner will ask you again on your next visit.',
      'Your browser may also let you block cookies entirely. If you block the Necessary group, bidding, registration and the saleroom\u2019s live updates will not work correctly, and we cannot guarantee that a bid will be recorded.',
    ],
  },
  {
    id: 'third-parties',
    heading: 'Third parties',
    body: [
      'Our hosting platform sets cookies needed to route and secure the deployment. Google reCAPTCHA sets a cookie when a form or the bid endpoint asks for a bot-check; it is in the Necessary group because without it we cannot tell a bidder from an automated attack.',
      'If you switch Analytics or Marketing on, the relevant third party would set cookies in those groups; the names and lifetimes are listed in the table above. We would not enable any such provider without first asking you in the banner.',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    body: [
      'If we add or remove a storage key, or change what one is used for, we will update the table on this page and change the "last updated" date. If the change would affect whether we need your consent, we will ask for it again rather than assume it.',
    ],
  },
];

export default function CookiePolicyPage() {
  const groups = ['Necessary', 'Functional', 'Analytics', 'Marketing'] as const;

  return (
    <>
      <LegalDoc
        title="Cookie Policy"
        intro="Every cookie and browser-storage key this site can set, what each one does, how long it lives, and which category you can switch off. Nothing optional is written until you have chosen in the cookie banner."
        updated={LEGAL_UPDATED}
        sections={sections}
        footer={
          <div className="space-y-4">
            <CookiePreferencesLink className="pill-btn pill-btn--dark" label="Open cookie preferences" />
            <p className="text-[11px] leading-relaxed text-[var(--ink-subtle)]">
              Reading this on a phone? The preferences panel is a full-height sheet with 48px
              controls; on a desktop it is a centred dialog with the same content.
            </p>
          </div>
        }
      />

      {/* ══ The table ═════════════════════════════════════════════════════ */}
      <section className="shell pb-16" aria-labelledby="storage-table-heading">
        <h2
          id="storage-table-heading"
          className="font-[family-name:var(--font-display)] text-[var(--text-h2)]"
        >
          Every key this site sets
        </h2>
        <hr className="rule-accent mt-4" />

        <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)]">
          <table className="results-table min-w-[880px]">
            <caption className="sr-only">
              Cookies and localStorage keys set by Lydia Auction House, with type, purpose,
              lifetime and consent category
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Purpose</th>
                <th scope="col">Lifetime</th>
                <th scope="col">Category</th>
              </tr>
            </thead>
            <tbody>
              {STORAGE.map((entry) => (
                <tr key={entry.name}>
                  <th scope="row" className="whitespace-nowrap font-[family-name:var(--font-mono)] text-left text-[var(--text-meta)]">
                    {entry.name}
                  </th>
                  <td className="whitespace-nowrap text-[var(--text-meta)] text-[var(--ink-muted)]">
                    {entry.type}
                  </td>
                  <td className="text-[var(--text-meta)] text-[var(--ink-muted)]">{entry.purpose}</td>
                  <td className="whitespace-nowrap text-[var(--text-meta)] text-[var(--ink-muted)]">
                    {entry.lifetime}
                  </td>
                  <td>
                    <span
                      className={`inline-block rounded-[var(--radius-pill)] px-2.5 py-1 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[0.08em] ${
                        GROUP_STYLES[entry.group]
                      }`}
                    >
                      {entry.group}
                      {entry.group === 'Necessary' ? (
                        <span aria-hidden="true" className="ml-1">
                          🔒
                        </span>
                      ) : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-[var(--ink-subtle)]">
          Necessary keys are locked on — the lock icon in the preferences panel explains why. The
          other three categories are switched off until you switch them on, and are removed if you
          switch them off again. Categories: {groups.join(' · ')}.
        </p>
      </section>
    </>
  );
}
