import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer }[];
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendMail(options: SendMailOptions): Promise<{ sent: boolean; mode: 'smtp' | 'console' }> {
  const from = process.env.SMTP_FROM ?? 'hr@antrosys.com';
  const transporter = getTransporter();

  if (!transporter) {
    console.info('[mail] SMTP not configured — logging email payload');
    console.info(`  To: ${options.to}`);
    console.info(`  Subject: ${options.subject}`);
    console.info(`  Attachments: ${options.attachments?.map((a) => a.filename).join(', ') ?? 'none'}`);
    return { sent: true, mode: 'console' };
  }

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });

  return { sent: true, mode: 'smtp' };
}
