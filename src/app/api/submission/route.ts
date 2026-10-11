/**
 * POST /api/submission
 *
 * Artist / seller consignment submission.
 *   • accepts up to three photographs, uploaded to Vercel Blob
 *   • validates the written fields
 *   • verifies reCAPTCHA v3 (action `artist_submission`)
 *   • persists the record and notifies the house by email
 *
 * Accepts `multipart/form-data` (with files) or `application/json` (without).
 */

import { NextResponse } from 'next/server';
import { CAPTCHA_ACTIONS, captchaGate, clientIp } from '@/lib/captcha';
import { rateLimit, saveSubmission, type SubmissionRecord } from '@/lib/store';
import { houseEmail, sendMail } from '@/lib/mailer';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_PHOTOS = 3;
/** 8 MB per file, matching the client-side guard. */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const ARTWORK_TYPES = [
  'Painting',
  'Sculpture',
  'Photography',
  'Jewellery',
  'Textile',
  'Ceramic',
  'Collector edition',
  'Cultural artefact',
  'Mixed / other',
];

const ESTIMATE_RANGES = [
  'Under KES 50,000',
  'KES 50,000 – 200,000',
  'KES 200,000 – 500,000',
  'KES 500,000 – 1,000,000',
  'KES 1,000,000 – 3,000,000',
  'Above KES 3,000,000',
];

/**
 * Uploads to Vercel Blob when a token is present. Without one, the file is
 * accepted and a data-URL-safe placeholder path is recorded so the submission
 * itself never fails — the house can follow up for the originals.
 */
async function uploadPhotos(files: File[]): Promise<{ urls: string[]; note?: string }> {
  if (files.length === 0) return { urls: [] };

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return {
      urls: [],
      note: 'Photographs were received but not stored — BLOB_READ_WRITE_TOKEN is not configured. Ask the sender to resend.',
    };
  }

  const { put } = await import('@vercel/blob');
  const urls: string[] = [];

  for (const file of files.slice(0, MAX_PHOTOS)) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80);
    const blob = await put(`submissions/${Date.now()}-${safeName}`, file, {
      access: 'public',
      token,
      addRandomSuffix: true,
      contentType: file.type,
    });
    urls.push(blob.url);
  }

  return { urls };
}

export async function POST(request: Request) {
  const limit = Number(process.env.RATE_LIMIT_FORM_PER_MIN ?? '5');
  const ip = clientIp(request.headers) ?? 'unknown';

  const quota = await rateLimit('submission', ip, limit);
  if (!quota.allowed) {
    return NextResponse.json(
      { ok: false, code: 'rate_limited', message: 'Too many submissions from this connection.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const contentType = request.headers.get('content-type') ?? '';
  let fields: Record<string, string> = {};
  let files: File[] = [];

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      for (const [key, value] of form.entries()) {
        if (value instanceof File) {
          if (value.size > 0) files.push(value);
        } else {
          fields[key] = value;
        }
      }
    } else {
      fields = ((await request.json()) as Record<string, string>) ?? {};
    }
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad_request', message: 'Could not read the submission.' },
      { status: 400 },
    );
  }

  const errors: Record<string, string> = {};
  if (!fields.name || fields.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!fields.email || !EMAIL_RE.test(fields.email)) errors.email = 'Please enter a valid email address.';
  if (!fields.phone || fields.phone.replace(/\D/g, '').length < 9) {
    errors.phone = 'Please include the country code so we can reach you.';
  }
  if (!fields.artworkType || !ARTWORK_TYPES.includes(fields.artworkType)) {
    errors.artworkType = 'Please choose the type of work.';
  }
  if (!fields.estimateRange || !ESTIMATE_RANGES.includes(fields.estimateRange)) {
    errors.estimateRange = 'Please choose an estimated value range.';
  }
  if (!fields.description || fields.description.trim().length < 20) {
    errors.description = 'Please describe the work — at least twenty characters.';
  }

  if (files.length > MAX_PHOTOS) {
    errors.photos = `Please attach no more than ${MAX_PHOTOS} photographs.`;
  }
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      errors.photos = 'Photographs must be JPEG, PNG, WebP or AVIF.';
      break;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      errors.photos = 'Each photograph must be under 8 MB.';
      break;
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, code: 'validation', errors, message: 'Please correct the highlighted fields.' },
      { status: 422 },
    );
  }

  const gate = await captchaGate(fields.captchaToken, CAPTCHA_ACTIONS.submission, ip);
  if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });

  const upload = await uploadPhotos(files);

  const record: SubmissionRecord = {
    id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: fields.name!.trim(),
    email: fields.email!.trim().toLowerCase(),
    phone: fields.phone!.trim(),
    artworkType: fields.artworkType!,
    estimateRange: fields.estimateRange!,
    description: fields.description!.trim(),
    photos: upload.urls,
    at: new Date().toISOString(),
  };

  await saveSubmission(record);

  const mail = await sendMail({
    subject: `Consignment submission — ${record.artworkType} from ${record.name}`,
    to: site.email,
    replyTo: record.email,
    text: [
      `Reference: ${record.id}`,
      `Name: ${record.name}`,
      `Email: ${record.email}`,
      `Phone: ${record.phone}`,
      `Artwork type: ${record.artworkType}`,
      `Estimate range: ${record.estimateRange}`,
      `Photographs: ${upload.urls.length}${upload.note ? ` (${upload.note})` : ''}`,
      ...upload.urls.map((url, i) => `  Photo ${i + 1}: ${url}`),
      '',
      record.description,
    ].join('\n'),
    html: houseEmail(
      `Consignment submission`,
      [
        ['Reference', record.id],
        ['Name', record.name],
        ['Email', record.email],
        ['Phone', record.phone],
        ['Artwork type', record.artworkType],
        ['Estimate', record.estimateRange],
        ['Photographs', String(upload.urls.length)],
        ['Description', record.description],
      ],
      upload.note ?? 'Submitted through the Sell with Us form.',
    ),
  });

  return NextResponse.json(
    {
      ok: true,
      reference: record.id,
      photos: upload.urls.length,
      notified: mail.delivered,
      message:
        'Received. Our specialists review every submission and respond within three working days.',
    },
    { status: 201 },
  );
}

export async function GET() {
  // Exposes the option sets so the client form and the server validator can
  // never drift apart.
  return NextResponse.json({
    ok: true,
    artworkTypes: ARTWORK_TYPES,
    estimateRanges: ESTIMATE_RANGES,
    maxPhotos: MAX_PHOTOS,
    maxPhotoBytes: MAX_PHOTO_BYTES,
    acceptedTypes: Array.from(ALLOWED_TYPES),
  });
}
