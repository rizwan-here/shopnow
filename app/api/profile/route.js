import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import StoreProfile from '@/models/StoreProfile';
import { getCurrentStoreProfile } from '@/lib/auth-store';
import { slugify } from '@/lib/utils';
import { readJson, safeHttpUrl, safeImageRef, str } from '@/lib/validators';

export async function PATCH(request) {
  const { session, profile } = await getCurrentStoreProfile();
  if (!profile || !session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  // Only allow safe URL schemes (blocks javascript:, data:text/html, etc.) in stored links/images.
  const urlRules = {
    storeLogo: safeImageRef,
    storeBanner: safeImageRef,
    profilePicture: safeImageRef,
    messengerUrl: (v) => (typeof v === 'string' ? safeHttpUrl(v) : null)
  };
  for (const [field, check] of Object.entries(urlRules)) {
    if (body[field] === undefined || body[field] === null) continue;
    const cleaned = check(body[field]);
    if (cleaned === null) {
      return NextResponse.json({ error: `Invalid URL for ${field}.` }, { status: 400 });
    }
    body[field] = cleaned;
  }
  const doc = await StoreProfile.findOne({ ownerId: session.user.id });

  if (!doc) {
    return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
  }

  // Handle slug/username change
  if (typeof body.slug === 'string' && body.slug && body.slug !== doc.slug) {
    const newSlug = slugify(body.slug);
    if (!newSlug) return NextResponse.json({ error: 'Invalid username.' }, { status: 400 });
    const reserved = ['store', 'api', 'dashboard', 'login', 'signup'];
    if (reserved.includes(newSlug)) return NextResponse.json({ error: 'Username is reserved.' }, { status: 400 });
    const exists = await StoreProfile.findOne({ slug: newSlug, _id: { $ne: doc._id } }).lean();
    if (exists) return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    doc.slug = newSlug;
  }

  doc.storeName = body.storeName ?? doc.storeName;
  doc.storeLogo = body.storeLogo ?? doc.storeLogo;
  doc.storeBanner = body.storeBanner ?? doc.storeBanner;
  doc.bio = body.bio ?? doc.bio;
  doc.instagramHandle = body.instagramHandle ?? doc.instagramHandle;
  doc.facebookHandle = body.facebookHandle ?? doc.facebookHandle;
  doc.whatsappNumber = body.whatsappNumber ?? doc.whatsappNumber;
  doc.messengerUrl = body.messengerUrl ?? doc.messengerUrl;
  doc.profilePicture = body.profilePicture ?? doc.profilePicture;
  doc.currencyCode = body.currencyCode ?? doc.currencyCode;
  doc.deliveryInsideDhaka = body.deliveryInsideDhaka ?? doc.deliveryInsideDhaka;
  doc.deliveryOutsideDhaka = body.deliveryOutsideDhaka ?? doc.deliveryOutsideDhaka;
  doc.freeDeliveryThreshold = body.freeDeliveryThreshold ?? doc.freeDeliveryThreshold;
  doc.defaultDeliveryEstimate = body.defaultDeliveryEstimate ?? doc.defaultDeliveryEstimate;
  doc.exchangePolicy = body.exchangePolicy ?? doc.exchangePolicy;
  doc.orderConfirmationTemplate = body.orderConfirmationTemplate ?? doc.orderConfirmationTemplate;
  doc.deliveryUpdateTemplate = body.deliveryUpdateTemplate ?? doc.deliveryUpdateTemplate;
  doc.outForDeliveryTemplate = body.outForDeliveryTemplate ?? doc.outForDeliveryTemplate;
  doc.paymentMethods = ['Cash on delivery'];

  await doc.save();

  return NextResponse.json(doc);
}
