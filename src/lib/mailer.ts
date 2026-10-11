/**
 * Outbound mail via Nodemailer.
 *
 * The design source had no backend and no notification path
 * (DESIGN-INVENTORY.md §9–10). Credentials come from SMTP_* environment
 * variables only; nothing is hard-coded and no address is ever logged.
 *
 * When SMTP is not configured, `sendMail` reports `delivered: false` rather
 * than throwing, so form submissions still succeed and are recorded in the
 * store. That keeps the enquiry in the database even if mail is down.
 */

import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { site } from './site';

interface MailInput {
  subject: string;
  /** Plain-text body. */
  text: string;
  /** Optional HTML body. */
  html?: string;
  replyTo?: string;
  to?: string;
}

export interface MailResult {
  delivered: boolean;
  reason?: string;
  messageId?: string;
}

let cachedTransport: Transporter | null = null;
let transportResolved = false;

function transport(): Transporter | null {
  if (transportResolved) return cachedTransport;
  transportResolved = true;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const configured = Boolean(host && user && pass);

  if (!configured) {
    cachedTransport = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? '587');
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user: user as string, pass: pass as string },
    // Nodemailer is the only transport; no pooling so serverless instances
    // do not hold sockets open between invocations.
    pool: false,
  });
  return cachedTransport;
}

const FROM =
  process.env.MAIL_FROM ?? `Lydia Auction House <no-reply@lydiaauctionhouse.co.ke>`;
const TO = process.env.MAIL_TO ?? site.email;

export async function sendMail(input: MailInput): Promise<MailResult> {
  const tx = transport();
  if (!tx) {
    return { delivered: false, reason: 'SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASSWORD).' };
  }

  try {
    const info = await tx.sendMail({
      from: FROM,
      to: input.to ?? TO,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html ?? textToHtml(input.text),
    });
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    return {
      delivered: false,
      reason: error instanceof Error ? error.message : 'Unknown SMTP failure.',
    };
  }
}

/** Escapes then converts newlines — safe for the untrusted field values we mail. */
export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#272630">${escaped.replace(
    /\n/g,
    '<br>',
  )}</div>`;
}

/** Shared shell for the house's notification emails. */
export function houseEmail(heading: string, rows: [string, string][], footer?: string): string {
  const cells = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 16px 8px 0;color:#5C5A6B;font-size:11px;letter-spacing:.12em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${escapeHtml(
          label,
        )}</td>
        <td style="padding:8px 0;color:#272630;font-size:15px">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join('');

  return `<div style="background:#F2F2F2;padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
    <div style="max-width:620px;margin:0 auto;background:#fff">
      <div style="background:#272630;padding:20px 28px">
        <p style="margin:0;color:#FFE468;font-size:11px;letter-spacing:.2em;text-transform:uppercase">Lydia Auction House</p>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:22px;color:#272630">${escapeHtml(
          heading,
        )}</h1>
        <table style="width:100%;border-collapse:collapse">${cells}</table>
        ${footer ? `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #E4E2DA;color:#5C5A6B;font-size:13px">${escapeHtml(footer)}</p>` : ''}
      </div>
      <div style="background:#FFE468;padding:14px 28px">
        <p style="margin:0;color:#272630;font-size:12px">${escapeHtml(site.address)}</p>
      </div>
    </div>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
