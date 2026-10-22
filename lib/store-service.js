import { connectToDatabase } from '@/lib/mongodb';
import { serialiseDocument } from '@/lib/utils';
import Category from '@/models/Category';
import Order from '@/models/Order';
import Product from '@/models/Product';
import StoreLink from '@/models/StoreLink';
import StoreProfile from '@/models/StoreProfile';
import Subscription from '@/models/Subscription';

// Fields of a store's data that only the store owner may see.
function toPublicSubscription(sub, isProActive) {
  return {
    plan: sub.plan,
    isProActive,
    adsEnabled: sub.adsEnabled,
    adsensePublisherId: sub.adsensePublisherId || '',
    adsenseBannerSlot: sub.adsenseBannerSlot || '',
    adsenseGridSlot: sub.adsenseGridSlot || ''
  };
}

/**
 * Returns the storefront payload for a slug.
 * `viewerOwnerId` is the signed-in user's id. Orders (customer PII), owner identity and
 * billing fields are only included when the viewer owns the store; everyone else gets
 * the public storefront data.
 */
export async function getStorePayloadBySlug(requestedSlug, viewerOwnerId = null) {
  if (typeof requestedSlug !== 'string' || !requestedSlug) {
    return null;
  }
  await connectToDatabase();
  const profileDoc = await StoreProfile.findOne({ slug: requestedSlug });
  if (!profileDoc) {
    return null;
  }

  const isOwner = Boolean(viewerOwnerId) && String(profileDoc.ownerId) === String(viewerOwnerId);

  const [categories, products, links, orders, subDoc] = await Promise.all([
    Category.find({ storeSlug: profileDoc.slug }).sort({ createdAt: 1 }),
    Product.find({ storeSlug: profileDoc.slug }).sort({ featured: -1, createdAt: -1 }),
    StoreLink.find({ storeSlug: profileDoc.slug }).sort({ createdAt: 1 }),
    isOwner
      ? Order.find({ storeSlug: profileDoc.slug, sellerDeletedAt: null }).sort({ createdAt: -1 })
      : Promise.resolve([]),
    Subscription.findOne({ ownerId: profileDoc.ownerId }).lean()
  ]);

  const now = new Date();
  const sub = subDoc || { plan: 'free', adsEnabled: true, adsensePublisherId: '', adsenseBannerSlot: '', adsenseGridSlot: '' };
  const isProActive = sub.plan === 'pro' && sub.proExpiresAt && now < new Date(sub.proExpiresAt);

  const profile = serialiseDocument(profileDoc);
  if (!isOwner) {
    delete profile.ownerId;
    delete profile.ownerEmail;
    delete profile.ownerName;
  }

  return {
    profile,
    categories: serialiseDocument(categories),
    products: serialiseDocument(products),
    links: serialiseDocument(links),
    orders: serialiseDocument(orders),
    subscription: isOwner
      ? serialiseDocument({ ...sub, isProActive })
      : serialiseDocument(toPublicSubscription(sub, isProActive))
  };
}

export async function getStorePayloadByOwnerId(ownerId) {
  if (typeof ownerId !== 'string' || !ownerId) {
    return null;
  }
  await connectToDatabase();
  const profileDoc = await StoreProfile.findOne({ ownerId });
  if (!profileDoc) {
    return null;
  }

  return getStorePayloadBySlug(profileDoc.slug, ownerId);
}

export function emptyStorePayload() {
  return {
    profile: null,
    categories: [],
    products: [],
    links: [],
    orders: [],
    subscription: { plan: 'free', isProActive: false, adsEnabled: true, adsensePublisherId: '', adsenseBannerSlot: '', adsenseGridSlot: '' }
  };
}
