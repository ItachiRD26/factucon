import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

export const FROM_EMAIL = 'Factucon <noreply@factucon.do>';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to:      string;
  subject: string;
  html:    string;
}): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}