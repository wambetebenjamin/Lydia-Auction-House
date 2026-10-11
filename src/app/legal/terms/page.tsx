import type { Metadata } from 'next';
import { LegalDoc, LEGAL_UPDATED, type LegalSection } from '@/components/legal/LegalDoc';

export const metadata: Metadata = {
  title: 'Terms of Sale',
  description:
    'The terms on which Lydia Auction House conducts its auctions and private sales — bidding, the 15% buyer\u2019s premium, reserves, payment, collection and Kenyan governing law.',
  alternates: { canonical: '/legal/terms' },
};

export const revalidate = 3600;

const sections: LegalSection[] = [
  {
    id: 'these-terms',
    heading: 'These terms',
    body: [
      'These are the terms on which Lydia Auction House ("the house", "we", "us") offers works of art at auction and by private sale. They form a contract between the house and each person who registers to bid, places a bid, or buys. By registering to bid you accept them.',
      'Where a lot is offered on behalf of a consignor, the contract of sale is between the buyer and the consignor, and the house acts as the consignor\u2019s agent. The consignor is not named on the lot page but is identified on the invoice.',
      'If any provision is found to be unenforceable, the rest of these terms continue in full force.',
    ],
  },
  {
    id: 'bidding',
    heading: 'Bidding and registration',
    body: [
      'To bid you must register with the house and be issued a paddle number. You must be at least 18 years old and must bid in your own name unless you have told us in writing that you are acting for another person, in which case you are jointly liable with them.',
      [
        'Bids may be placed in the saleroom, by telephone, by commission (a maximum figure left with us in advance), or online through this website.',
        'A bid is an irrevocable offer to buy at that amount, and remains open until the lot closes or a higher bid is accepted.',
        'Where two identical bids are received, the earlier bid prevails.',
        'We may refuse to accept a bid, refuse a paddle, or withdraw a lot from sale at any time before the hammer falls.',
        'Online bids are transmitted to the auctioneer and acknowledged in the bidding panel. Our records of bids, and the resulting sale, are conclusive.',
        'Where an online connection fails, our polling fallback continues to show you the last confirmed state of the lot, and you are bound by the outcome reached in the saleroom.',
      ],
      'The bid increment ladder shown on each lot page is set by the auctioneer. "Next bid: KES X,XXX." is the lowest amount we will accept for that lot at that moment.',
    ],
  },
  {
    id: 'buyers-premium',
    heading: 'Buyer\u2019s premium and other charges',
    body: [
      'A buyer\u2019s premium of 15% is added to the hammer price of every lot. The premium is subject to value added tax where it applies.',
      [
        'Hammer price — the amount at which the auctioneer accepts a bid.',
        'Buyer\u2019s premium — 15% of the hammer price, payable by the buyer.',
        'VAT — charged on the premium and on any lot marked as VAT-inclusive. Where a lot is marked with a dagger (†), VAT is charged on the hammer price as well.',
        'Delivery, packing, insurance in transit and any export licence costs — quoted on request and payable by the buyer.',
      ],
      'For Buy It Now lots the price shown is the hammer-equivalent figure, and the 15% buyer\u2019s premium is added at checkout in the same way.',
    ],
  },
  {
    id: 'reserves',
    heading: 'Reserves',
    body: [
      'Many lots carry a reserve — a confidential minimum agreed with the consignor below which the lot will not be sold. A lot marked "No reserve" will be sold to the highest bidder whatever the amount.',
      'The auctioneer may open the bidding on a lot at any level below the reserve and may bid on the consignor\u2019s behalf up to the reserve, but never at or above it. You will see "Reserve not met" or "Reserve met" in the bidding panel; once the reserve is met, the lot will sell.',
    ],
  },
  {
    id: 'after-the-sale',
    heading: 'After the sale: payment and collection',
    body: [
      'The buyer is the highest bidder when the lot closes. An invoice is issued immediately and payment is due as follows:',
      [
        'Payment in full within seven days of the sale, by bank transfer, M-PESA or card.',
        'Collection or arrangement of delivery within fourteen days of cleared payment.',
        'Storage is free for the first fourteen days after the sale, then charged at KES 1,000 per lot per week.',
        'Risk in a lot passes to the buyer on the fall of the hammer; title passes only when payment has cleared in full.',
        'We may set off any amount you owe us against any amount we owe you.',
      ],
      'If payment is not made, we may cancel the sale, resell the lot without further notice, and recover from you any shortfall between the original hammer price and the resale price, together with our reasonable costs.',
    ],
  },
  {
    id: 'descriptions',
    heading: 'Descriptions, condition and authenticity',
    body: [
      'We catalogue every lot honestly and to the best of our specialists\u2019 knowledge, but descriptions are statements of opinion, not warranties of fact.',
      [
        'Dimensions are given in centimetres, height before width; where a work is framed, the framed size is stated.',
        'Condition reports are prepared on request and describe the work as we see it, including faults visible under normal gallery lighting. They are not a substitute for viewing, and they are not exhaustive.',
        'Where authorship cannot be established to our satisfaction, a lot is catalogued "in the manner of", "after", "school of" or "attributed to" that artist, and the estimate reflects it.',
        'The property in each lot is offered with the benefits and burdens of the consignor\u2019s title and any encumbrances of which we are aware.',
      ],
      'A buyer who believes a lot has been materially misdescribed must notify us in writing within 21 days of the sale, return the lot in the condition in which it was sold, and give us a reasonable opportunity to have it re-examined by a specialist acceptable to both parties. Our liability in such a case is limited to the hammer price, the buyer\u2019s premium and any VAT paid.',
    ],
  },
  {
    id: 'consignors',
    heading: 'Consignors',
    body: [
      'A consignor warrants that they own the lot, or are authorised to sell it, that it is free of any claim, restriction or export licence requirement not disclosed to us, and that the information they give us about authorship, provenance and condition is accurate.',
      'Commission, photography, insurance and any applicable charges are agreed in writing before the catalogue goes to press. Payment to the consignor is made within fourteen days of the end of the sale period, once the buyer\u2019s payment has cleared.',
      'The consignor may set the reserve and may withdraw a lot before the catalogue is published; after publication, withdrawal requires our agreement and we may charge our reasonable costs and any applicable withdrawal fee.',
    ],
  },
  {
    id: 'liability',
    heading: 'Liability',
    body: [
      'Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot lawfully be limited.',
      'Subject to that, our total liability arising out of any lot is limited to the hammer price, the buyer\u2019s premium and any VAT paid on that lot. We are not liable for loss of profit, loss of opportunity or indirect loss.',
      'We are not liable for any failure or delay caused by something outside our reasonable control, including power failure, network or hosting failure, or industrial action. We will do what we reasonably can to notify you of such an event and to keep the saleroom running.',
    ],
  },
  {
    id: 'governing-law',
    heading: 'Governing law and jurisdiction',
    body: [
      'These terms, and any dispute or claim arising out of or in connection with them or the sale of a lot, are governed by the laws of Kenya.',
      'The courts of Kenya have exclusive jurisdiction, and each party submits to that jurisdiction. Before starting proceedings, both parties agree to try to resolve the dispute in good faith, including by mediation if either asks for it.',
      'Where a buyer is a consumer resident outside Kenya, nothing in this clause removes any right they have under the mandatory law of their country of residence.',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Sale"
      intro="The terms on which we conduct auctions and private sales: how bidding works, what you pay, how long you have, and what happens if something goes wrong. The 15% buyer's premium and Kenyan governing law sit at the centre of them."
      updated={LEGAL_UPDATED}
      sections={sections}
      footer={
        <div className="space-y-4">
          <p className="text-[var(--text-body-min)] leading-relaxed text-[var(--ink-muted)]">
            A one-page summary of the practical points — premium, payment window, collection — is
            shown on every lot page under "Terms".
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/register" className="pill-btn pill-btn--dark">
              Register to Bid
            </a>
            <a href="/legal/privacy-policy" className="pill-btn pill-btn--ghost">
              Privacy policy
            </a>
          </div>
        </div>
      }
    />
  );
}
