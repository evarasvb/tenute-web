type SendEmailArgs = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

type SendEmailResult = {
  data?: { id?: string };
  error?: { message?: string };
};

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendEmailViaResend(args: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no esta configurada');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });

  const payload = (await response.json().catch(() => ({}))) as SendEmailResult;
  if (!response.ok) {
    const message = payload?.error?.message || 'Error enviando email con Resend';
    throw new Error(message);
  }

  return payload;
}
