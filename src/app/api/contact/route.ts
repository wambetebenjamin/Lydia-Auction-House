/**
 * POST /api/contact
 *
 * Private sale enquiry and general contact. Delivered by Nodemailer to the
 * house inbox; gated by reCAPTCHA v3 (action `contact_enquiry`).
 */

import { NextResponse } from 'next/server';
import { CAPTCHA_ACTIONS, captchaGate, clientIp } from '@/lib/captcha';
import { rateLimit } from '@/lib/store';
import { houseEmail, sendMail } from '@/lib/mailer';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface ContactBody {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  /** Optional lot the enquiry refers to. */
  lot?: string;
  interest?: string;
  captchaToken?: string;
}

const INTERESTS = ['Buying', 'Selling', 'Private viewing', 'Consignment', 'Press', 'Other'];

export async function POST(request: Request) {
  const limit = Number(process.env.RATE_LIMIT_FORM_PER_MIN ?? '5');
  const ip = clientIp(request.headers) ?? 'unknown';

  const quota = await rateLimit('contact', ip, limit);
  if (!quota.allowed) {
    return NextResponse.json(
      { ok: false, code: 'rate_limited', message: 'Too many enquiries from this connection.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  let body: ContactBody;
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad_request', message: 'Expected a JSON body.' },
      { status: 400 },
    );
  }

  const errors: Record<string, string> = {};
  if (!body.name || body.name.trim().length < 2) errors.name = 'Please tell us your name.';
  if (!body.email || !EMAIL_RE.test(body.email)) errors.email = 'Please enter a valid email address.';
  if (!body.message || body.message.trim().length < 10) {
    errors.message = 'Please give us a little more detail — at least ten characters.';
  }
  if (body.interest && !INTERESTS.includes(body.interest)) {
    errors.interest = 'Please choose one of the listed enquiry types.';
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, code: 'validation', errors, message: 'Please correct the highlighted fields.' },
      { status: 422 },
    );
  }

  const gate = await captchaGate(body.captchaToken, CAPTCHA_ACTIONS.contact, ip);
  if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });

  const subject = body.subject?.trim() || `Website enquiry — ${body.interest ?? 'General'}`;
  const lines = [
    `Name: ${body.name}`,
    `Email: ${body.email}`,
    body.phone ? `Phone: ${body.phone}` : '',
    body.interest ? `Interest: ${body.interest}` : '',
    body.lot ? `Lot: ${body.lot}` : '',
    '',
    body.message,
  ].filter(Boolean);

  const mail = await sendMail({
    subject,
    replyTo: body.email,
    to: site.email,
    text: lines.join('\n'),
    html: houseEmail(
      subject,
      [
        ['Name', body.name ?? ''],
        ['Email', body.email ?? ''],
        ['Phone', body.phone ?? '—'],
        ['Interest', body.interest ?? '—'],
        ['Lot', body.lot ?? '—'],
        ['Message', body.message ?? ''],
      ],
      'Sent from the private sale enquiry form.',
    ),
  });

  // A configured-but-failing mail server is a real error the sender must know about.
  if (!mail.delivered && mail.reason && !mail.reason.startsWith('SMTP is not configured')) {
    return NextResponse.json(
      {
        ok: false,
        code: 'mail_failed',
        message:
          'We could not deliver your enquiry just now. Please reach us on WhatsApp and we will pick it up immediately.',
        whatsapp: site.whatsappLink,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      delivered: mail.delivered,
      message:
        'Thank you — your enquiry is with the house. We reply to every message within one working day.',
    },
    { status: 201 },
  );
}
