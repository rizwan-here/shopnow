import { connectToDatabase } from '@/lib/mongodb';
import { serialiseDocument } from '@/lib/utils';
import Category from '@/models/Category';
import Order from '@/models/Order';
import Product from '@/models/Product';
import StoreLink from '@/models/StoreLink';
import StoreProfile from '@/models/StoreProfile';

export async function getStorePayloadBySlug(requestedSlug) {
  await connectToDatabase();
  const profileDoc = await StoreProfile.findOne({ slug: requestedSlug });
  if (!profileDoc) {
    return null;
  }

  const [categories, products, links, orders] = await Promise.all([
    Category.find({ storeSlug: profileDoc.slug }).sort({ createdAt: 1 }),
    Product.find({ storeSlug: profileDoc.slug }).sort({ featured: -1, createdAt: -1 }),
    StoreLink.find({ storeSlug: profileDoc.slug }).sort({ createdAt: 1 }),
    Order.find({ storeSlug: profileDoc.slug, sellerDeletedAt: null }).sort({ createdAt: -1 })
  ]);

  return {
    profile: serialiseDocument(profileDoc),
    categories: serialiseDocument(categories),
    products: serialiseDocument(products),
    links: serialiseDocument(links),
    orders: serialiseDocument(orders)
  };
}

export async function getStorePayloadByOwnerId(ownerId) {
  await connectToDatabase();
  const profileDoc = await StoreProfile.findOne({ ownerId });
  if (!profileDoc) {
    return null;
  }

  return getStorePayloadBySlug(profileDoc.slug);
}

export function emptyStorePayload() {
  return {
    profile: null,
    categories: [],
    products: [],
    links: [],
    orders: []
  };
}
