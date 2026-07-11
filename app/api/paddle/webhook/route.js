import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyPaddleWebhookSignature } from '@/lib/paddle';
import Subscription from '@/models/Subscription';

// Paddle subscription statuses that should count as "Pro is active"
const ACTIVE_STATUSES = new Set(['active', 'trialing']);

async function findSubscriptionDoc({ ownerId, customerId, subscriptionId }) {
  if (subscriptionId) {
    const bySub = await Subscription.findOne({ paddleSubscriptionId: subscriptionId });
    if (bySub) return bySub;
  }
  if (ownerId) {
    const byOwner = await Subscription.findOne({ ownerId });
    if (byOwner) return byOwner;
  }
  if (customerId) {
    const byCustomer = await Subscription.findOne({ paddleCustomerId: customerId });
    if (byCustomer) return byCustomer;
  }
  return null;
}

export async function POST(request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('paddle-signature');
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!verifyPaddleWebhookSignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = event?.event_type;
  const data = event?.data || {};

  await connectToDatabase();

  try {
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.activated':
      case 'subscription.updated':
      case 'subscription.canceled':
      case 'subscription.paused': {
        const ownerId = data?.custom_data?.ownerId || null;
        const customerId = data?.customer_id || null;
        const subscriptionId = data?.id || null;
        const status = data?.status || '';
        const priceId = data?.items?.[0]?.price?.id || '';
        const nextBilledAt = data?.current_billing_period?.ends_at || data?.next_billed_at || null;

        let sub = await findSubscriptionDoc({ ownerId, customerId, subscriptionId });

        if (!sub && ownerId) {
          sub = new Subscription({ ownerId, plan: 'free' });
        }
        if (!sub) {
          // No way to associate this event with a store — ignore safely.
          break;
        }

        sub.paddleCustomerId = customerId || sub.paddleCustomerId;
        sub.paddleSubscriptionId = subscriptionId || sub.paddleSubscriptionId;
        sub.paddlePriceId = priceId || sub.paddlePriceId;
        sub.paddleStatus = status;
        sub.cancelAtPeriodEnd = Boolean(data?.scheduled_change?.action === 'cancel');

        if (ACTIVE_STATUSES.has(status)) {
          sub.plan = 'pro';
          sub.proActivatedAt = sub.proActivatedAt || new Date();
          sub.proExpiresAt = nextBilledAt ? new Date(nextBilledAt) : sub.proExpiresAt;
        } else {
          // canceled / paused / past_due → fall back to free once the paid period truly ends.
          // If Paddle still reports a future period end, honor it; otherwise downgrade now.
          if (nextBilledAt && new Date(nextBilledAt) > new Date()) {
            sub.proExpiresAt = new Date(nextBilledAt);
          } else {
            sub.plan = 'free';
          }
        }

        await sub.save();
        break;
      }

      default:
        // Unhandled event types are acknowledged but ignored.
        break;
    }
  } catch (err) {
    console.error('Paddle webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
