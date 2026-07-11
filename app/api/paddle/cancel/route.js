import { NextResponse } from 'next/server';
import { getCurrentStoreProfile } from '@/lib/auth-store';
import { connectToDatabase } from '@/lib/mongodb';
import { paddleApiRequest } from '@/lib/paddle';
import Subscription from '@/models/Subscription';

// POST /api/paddle/cancel → schedules the caller's Pro subscription to cancel at the end of the current period
export async function POST() {
  const { session, profile } = await getCurrentStoreProfile();
  if (!session || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const sub = await Subscription.findOne({ ownerId: session.user.id });

  if (!sub?.paddleSubscriptionId) {
    return NextResponse.json({ error: 'No active Paddle subscription found.' }, { status: 400 });
  }

  try {
    await paddleApiRequest(`/subscriptions/${sub.paddleSubscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ effective_from: 'next_billing_period' }),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to cancel subscription.' }, { status: 502 });
  }

  sub.cancelAtPeriodEnd = true;
  await sub.save();

  return NextResponse.json({ ...sub.toObject(), cancelAtPeriodEnd: true });
}
