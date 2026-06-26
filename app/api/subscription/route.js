import { NextResponse } from 'next/server';
import { getCurrentStoreProfile } from '@/lib/auth-store';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';

// GET  /api/subscription  → returns the caller's subscription record
export async function GET() {
  const { session, profile } = await getCurrentStoreProfile();
  if (!session || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  let sub = await Subscription.findOne({ ownerId: session.user.id }).lean();

  if (!sub) {
    // Auto-create a free subscription record on first fetch
    sub = await Subscription.create({
      ownerId: session.user.id,
      ownerEmail: session.user.email || '',
      plan: 'free',
      adsEnabled: true,
    });
    sub = sub.toObject();
  }

  const now = new Date();
  const isProActive =
    sub.plan === 'pro' && sub.proExpiresAt && now < new Date(sub.proExpiresAt);

  return NextResponse.json({ ...sub, isProActive });
}

// PATCH /api/subscription  → update adsense config OR submit a pro upgrade request
export async function PATCH(request) {
  const { session, profile } = await getCurrentStoreProfile();
  if (!session || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const body = await request.json().catch(() => ({}));

  let sub = await Subscription.findOne({ ownerId: session.user.id });
  if (!sub) {
    sub = new Subscription({
      ownerId: session.user.id,
      ownerEmail: session.user.email || '',
      plan: 'free',
    });
  }

  // ── AdSense config update (any plan can configure, but ads only show on free)
  if (body.adsensePublisherId !== undefined) sub.adsensePublisherId = body.adsensePublisherId.trim();
  if (body.adsenseBannerSlot  !== undefined) sub.adsenseBannerSlot  = body.adsenseBannerSlot.trim();
  if (body.adsenseGridSlot    !== undefined) sub.adsenseGridSlot    = body.adsenseGridSlot.trim();

  // ── Pro upgrade request — seller submits payment reference for manual review
  if (body.action === 'request_pro') {
    const ref = String(body.paymentRef || '').trim();
    if (!ref) {
      return NextResponse.json({ error: 'Payment reference is required.' }, { status: 400 });
    }
    sub.paymentRef  = ref;
    sub.paymentNote = String(body.paymentNote || '').trim();
    // Mark as "pending_pro" via a note — admin confirms manually via DB or future admin panel
    // For now we optimistically set pro for 30 days (admin can revert if payment fails)
    sub.plan           = 'pro';
    sub.proActivatedAt = new Date();
    sub.proExpiresAt   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
  }

  await sub.save();

  const now = new Date();
  const isProActive =
    sub.plan === 'pro' && sub.proExpiresAt && now < new Date(sub.proExpiresAt);

  return NextResponse.json({ ...sub.toObject(), isProActive });
}
