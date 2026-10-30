import { NextResponse } from 'next/server';
import { getCurrentStoreProfile } from '@/lib/auth-store';
import { connectToDatabase } from '@/lib/mongodb';
import { readJson, str } from '@/lib/validators';
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
  const body = (await readJson(request)) || {};

  let sub = await Subscription.findOne({ ownerId: session.user.id });
  if (!sub) {
    sub = new Subscription({
      ownerId: session.user.id,
      ownerEmail: session.user.email || '',
      plan: 'free',
    });
  }

  // ── AdSense config update (any plan can configure, but ads only show on free).
  // IDs are validated so arbitrary strings cannot be stored and later rendered into ad markup.
  const publisherOk = (v) => v === '' || /^ca-pub-\d{10,20}$/.test(v);
  const slotOk = (v) => v === '' || /^\d{5,20}$/.test(v) || v === 'REPLACE_WITH_YOUR_SLOT_ID';
  if (body.adsensePublisherId !== undefined) {
    const v = str(body.adsensePublisherId, 40);
    if (!publisherOk(v)) return NextResponse.json({ error: 'Invalid AdSense publisher ID (expected ca-pub-…).' }, { status: 400 });
    sub.adsensePublisherId = v;
  }
  if (body.adsenseBannerSlot !== undefined) {
    const v = str(body.adsenseBannerSlot, 40);
    if (!slotOk(v)) return NextResponse.json({ error: 'Invalid AdSense banner slot ID.' }, { status: 400 });
    sub.adsenseBannerSlot = v;
  }
  if (body.adsenseGridSlot !== undefined) {
    const v = str(body.adsenseGridSlot, 40);
    if (!slotOk(v)) return NextResponse.json({ error: 'Invalid AdSense grid slot ID.' }, { status: 400 });
    sub.adsenseGridSlot = v;
  }

  // ── Manual Pro upgrade request.
  // SECURITY: this used to set plan='pro' for 30 days for ANY non-empty reference,
  // i.e. free Pro for everyone. A reference alone is not proof of payment, so the
  // request is now only recorded for manual review. Pro is granted exclusively by the
  // signature-verified Paddle webhook (/api/paddle/webhook) or by an admin in the DB.
  if (body.action === 'request_pro') {
    const ref = str(body.paymentRef, 200);
    if (!ref) {
      return NextResponse.json({ error: 'Payment reference is required.' }, { status: 400 });
    }
    sub.paymentRef = ref;
    sub.paymentNote = str(body.paymentNote, 500);
    await sub.save();
    const isProActiveNow = sub.plan === 'pro' && sub.proExpiresAt && new Date() < new Date(sub.proExpiresAt);
    return NextResponse.json(
      { ...sub.toObject(), isProActive: Boolean(isProActiveNow), pendingReview: true, message: 'Request received. Pro is activated after payment is verified.' },
      { status: 202 }
    );
  }

  await sub.save();

  const now = new Date();
  const isProActive =
    sub.plan === 'pro' && sub.proExpiresAt && now < new Date(sub.proExpiresAt);

  return NextResponse.json({ ...sub.toObject(), isProActive });
}
