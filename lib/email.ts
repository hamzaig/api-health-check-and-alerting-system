import nodemailer from 'nodemailer';

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURITY,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
} = process.env;

const port = SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587;
const security = (SMTP_SECURITY || '').toLowerCase();
const useSsl = security === 'ssl' || port === 465;
const useStartTls = security === 'tls' && !useSsl;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: useSsl,
  auth: SMTP_USERNAME
    ? {
        user: SMTP_USERNAME,
        pass: SMTP_PASSWORD + "$",
      }
    : undefined,
  requireTLS: useStartTls,
});

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  if (!SMTP_HOST || !SMTP_FROM_EMAIL) {
    console.warn('Email not sent: SMTP configuration is missing');
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM_NAME
      ? `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`
      : SMTP_FROM_EMAIL,
    to,
    subject,
    text,
    html,
  });
}
