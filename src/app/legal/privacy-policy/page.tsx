import type { Metadata } from 'next';
import { LegalDoc, LEGAL_UPDATED, type LegalSection } from '@/components/legal/LegalDoc';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Lydia Auction House collects, uses and protects personal data under the Kenya Data Protection Act 2019 — what we hold, why, how long, and how to exercise your rights.',
  alternates: { canonical: '/legal/privacy-policy' },
};

export const revalidate = 3600;

const sections: LegalSection[] = [
  {
    id: 'who-we-are',
    heading: 'Who we are',
    body: [
      'Lydia Auction House ("the house", "we") is the auctioneer and data controller for the personal data described in this policy. Our registered address is The Loft, 2nd Floor, Kimathi Street, Nairobi CBD, Nairobi, Kenya.',
      'We are registered as a data controller with the Office of the Data Protection Commissioner of Kenya, as required by the Data Protection Act, 2019 (the "Act"). Our data protection contact can be reached at privacy@lydiaauctionhouse.co.ke or on +254 112 272 061.',
    ],
  },
  {
    id: 'what-we-collect',
    heading: 'What we collect',
    body: [
      'We collect only what the auction process needs. Depending on how you use the site, this may include:',
      [
        'Identity and contact data — your name, email address, telephone number and postal address.',
        'Bidder data — the paddle number we issue you, the lots you bid on, your bid amounts and outcomes. Registration data is required to allow you to bid; if you do not provide it, we cannot accept your bid.',
        'Transaction data — invoices, payment confirmations, delivery or collection details, and the records we are required to keep for tax and anti-money-laundering purposes.',
        'Consignment data — details of works you ask us to assess or sell, including the photographs you upload, and the provenance you give us.',
        'Technical data — an anonymous session identifier, your IP address, browser type and the pages you visit. This is used for rate limiting abuse, keeping the live bidding channel working, and understanding which parts of the catalogue are read.',
        'Cookie and consent data — your cookie choices, stored in your own browser under the key "lah:cookie-consent", not transmitted to us except as part of an ordinary HTTP request.',
      ],
      'We do not knowingly collect the personal data of anyone under 18. Bidding is restricted to adults.',
    ],
  },
  {
    id: 'why',
    heading: 'Why we use it, and our lawful basis',
    body: [
      'Under section 30 of the Act we must identify a lawful basis for each purpose. Ours are as follows:',
      [
        'To accept and process your bids, issue paddles and run the auction — necessary for the performance of a contract with you (section 30(1)(b)).',
        'To invoice you, take payment, settle consignors and keep statutory records — necessary to comply with a legal obligation (section 30(1)(c)) and for our legitimate interests in being paid.',
        'To publish sale results and lot archives — our legitimate interest in an accurate public auction record, balanced against your rights; results name works and artists, never bidders as individuals.',
        'To answer enquiries, assess consignments and administer private sales — our legitimate interest in operating the business, or your consent where you have given it.',
        'To send you auction alerts, catalogue announcements and — occasionally — market news by email or WhatsApp — your consent, which you may withdraw at any time using the unsubscribe link in every message.',
        'To rate-limit abusive bidding and protect the integrity of the saleroom — our legitimate interest in preventing interference with the auction.',
      ],
    ],
  },
  {
    id: 'sharing',
    heading: 'Who we share it with',
    body: [
      'We do not sell personal data, and we do not share it for third-party marketing.',
      [
        'Service providers who process data on our instruction: Vercel (hosting, Redis-compatible key-value store and file storage), our email provider, reCAPTCHA (bot protection), and our accountants and auditors. Each is bound by a written agreement.',
        'Payment providers and banks, where necessary to take or make payment.',
        'Consignors, in limited form — a successful seller is told the paddle number and invoice value of the winning bid, and nothing more about the buyer, unless you ask us to introduce you.',
        'Law enforcement, courts and regulators, where we are required by law or where it is necessary to establish, exercise or defend a legal claim.',
      ],
      'Where a processor is outside Kenya — for example in the United States or the European Union — we rely on the transfer provisions in sections 48 and 49 of the Act, and require appropriate contractual safeguards and, where applicable, the standard data protection clauses.',
    ],
  },
  {
    id: 'retention',
    heading: 'How long we keep it',
    body: [
      'We keep personal data only as long as we need it:',
      [
        'Bidder registration and bid records — seven years from the end of the sale, to match our tax and audit obligations.',
        'Consignment and vetting records, including provenance photographs — seven years after the work is sold or returned to you.',
        'Enquiry correspondence — two years from the last message in the thread.',
        'Marketing consent — until you withdraw it, plus a small suppression record so that we do not contact you again by mistake.',
        'Server logs and technical data — 30 days, then deleted or aggregated irreversibly.',
      ],
      'When a retention period ends we delete the data, or irreversibly anonymise it where we still need it for statistical purposes.',
    ],
  },
  {
    id: 'your-rights',
    heading: 'Your rights',
    body: [
      'The Act gives you the following rights over your personal data, and we will answer any request within 30 days:',
      [
        'To be informed of how your data is used — this policy is that notice.',
        'To access a copy of the personal data we hold about you.',
        'To have inaccurate or incomplete data corrected.',
        'To request erasure of data we no longer have a lawful reason to keep.',
        'To restrict or object to processing, including profiling and direct marketing.',
        'To receive data you gave us in a structured, machine-readable format, or have it sent to another controller.',
        'To withdraw consent at any time, without affecting the lawfulness of what we did before.',
        'Not to be subject to a decision made solely by automated means that produces a legal or similarly significant effect. We do not make any such decisions — every auction decision has a human in it.',
      ],
      'To exercise any of these rights, email privacy@lydiaauctionhouse.co.ke. We may ask for proof of identity so that we do not disclose your data to somebody else. If you are unhappy with our response you may complain to the Office of the Data Protection Commissioner of Kenya, or to the supervisory authority in your own country of residence.',
    ],
  },
  {
    id: 'security',
    heading: 'How we protect it',
    body: [
      'All traffic to this site is encrypted with TLS, and we send HSTS headers so browsers will refuse to downgrade a connection. Photographs you upload for consignment are stored with unguessable keys and are readable only by our specialists. Bidder sessions are scoped to the lot you are bidding on and are not shared between bidders.',
      'Bid and form endpoints are rate-limited at our edge before they reach the application, and every public form is protected by reCAPTCHA. Internally, access to personal data is limited to staff who need it to do their job, and we keep a record of who has accessed bidder records.',
      'If a personal data breach occurs that is likely to result in a risk to your rights, we will notify the Data Commissioner within 72 hours of becoming aware of it, and will tell you without undue delay where the breach is likely to result in a high risk to you.',
    ],
  },
  {
    id: 'cookies',
    heading: 'Cookies and local storage',
    body: [
      'This site uses a small number of strictly necessary cookies and browser-storage keys to keep bidding working. Anything beyond that — analytics and marketing — is set only if you accept it in the cookie banner or in Manage Preferences.',
      'The full list, with names, purposes and lifetimes, is in our cookie policy. You can change your mind at any time from the "Cookie preferences" link in the footer of every page; your choice is remembered in localStorage under "lah:cookie-consent".',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    body: [
      'We will update this page whenever our processing changes materially, and we will change the "last updated" date at the top. Where a change affects what we do with data you have already given us, we will tell you directly by email if we hold your address, and ask for fresh consent where the law requires it.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      intro="This policy explains what personal data Lydia Auction House collects when you bid, consign, enquire or browse, why we hold it, who we share it with, and the rights you have over it under the Data Protection Act, 2019 of Kenya."
      updated={LEGAL_UPDATED}
      sections={sections}
      footer={
        <p className="text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
          Read the{' '}
          <a href="/legal/cookie-policy" className="font-semibold underline decoration-2 underline-offset-2">
            cookie policy
          </a>{' '}
          for the specific storage keys this site sets, and the{' '}
          <a href="/legal/terms" className="font-semibold underline decoration-2 underline-offset-2">
            auction terms
          </a>{' '}
          for the contractual side of bidding.
        </p>
      }
    />
  );
}
