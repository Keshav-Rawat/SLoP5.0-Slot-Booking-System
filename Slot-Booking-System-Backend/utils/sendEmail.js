/**
 * sendEmail.js — Nodemailer transporter for Gmail SMTP.
 *
 * Environment variables required on Render (and in your local .env for dev):
 *
 *   GMAIL_USER   — your Gmail address, e.g. yourname@gmail.com
 *   GMAIL_PASS   — a Gmail App Password (NOT your regular password).
 *                  Create one at: https://myaccount.google.com/apppasswords
 *                  (Requires 2-Step Verification to be enabled on the account.)
 *   GMAIL_FROM   — (optional) display name + address, e.g.:
 *                  '"SLoP Booking System" <yourname@gmail.com>'
 *                  Defaults to GMAIL_USER if not set.
 *
 * How to generate a Gmail App Password:
 *   1. Go to https://myaccount.google.com/security
 *   2. Enable 2-Step Verification if not already on.
 *   3. Visit https://myaccount.google.com/apppasswords
 *   4. Select app: "Mail", device: "Other" → name it "SLoP Backend"
 *   5. Copy the 16-character password → paste into GMAIL_PASS env var.
 *
 * @param {Object} options
 * @param {string} options.to      - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html    - HTML email body
 * @param {string} [options.text]  - Plain-text fallback (auto-generated if omitted)
 * @returns {Promise<void>}
 */

import nodemailer from 'nodemailer';

const createTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      'Email not configured. Set GMAIL_USER and GMAIL_PASS environment variables.'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

/**
 * Send a transactional email via Gmail SMTP.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  const from = process.env.GMAIL_FROM || process.env.GMAIL_USER;

  const mailOptions = {
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''), // strip tags for plain-text fallback
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧  Email sent to ${to} — Message ID: ${info.messageId}`);
  return info;
};

export default sendEmail;
