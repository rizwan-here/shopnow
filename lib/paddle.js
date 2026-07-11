import crypto from 'crypto';

// Paddle sends: `Paddle-Signature: ts=1234567890;h1=<hex hmac>`
// The signed payload is `${ts}:${rawRequestBody}`, HMAC-SHA256'd with your
// notification webhook secret (starts with `pdl_ntfset_...` in Paddle > Developer tools > Notifications).
export function verifyPaddleWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(';').map((chunk) => {
      const [key, value] = chunk.split('=');
      return [key?.trim(), value?.trim()];
    })
  );

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(h1, 'hex'));
  } catch {
    return false;
  }
}

const PADDLE_API_BASE = process.env.PADDLE_ENV === 'production'
  ? 'https://api.paddle.com'
  : 'https://sandbox-api.paddle.com';

// Thin wrapper around the Paddle REST API (used for e.g. cancelling a subscription).
export async function paddleApiRequest(path, options = {}) {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error('PADDLE_API_KEY is not configured.');

  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.detail || data?.error?.type || `Paddle API error (${res.status})`;
    throw new Error(message);
  }
  return data;
}
