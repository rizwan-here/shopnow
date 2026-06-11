import { NextResponse } from 'next/server';
import { requireSession, getCurrentStoreProfile } from '@/lib/auth-store';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';
import Order from '@/models/Order';
import Product from '@/models/Product';
import StoreLink from '@/models/StoreLink';
import StoreProfile from '@/models/StoreProfile';

export async function DELETE(request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getCurrentStoreProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const confirmSlug = (body.confirmSlug || '').trim().toLowerCase();
  const confirmText = (body.confirmText || '').trim().toUpperCase();

  if (confirmSlug !== String(profile.slug).toLowerCase() || confirmText !== 'DELETE') {
    return NextResponse.json({ error: 'Confirmation did not match. Please enter your store username and type DELETE.' }, { status: 400 });
  }

  await connectToDatabase();
  const storeSlug = profile.slug;

  await Promise.all([
    Category.deleteMany({ storeSlug }),
    Product.deleteMany({ storeSlug }),
    Order.deleteMany({ storeSlug }),
    StoreLink.deleteMany({ storeSlug }),
    StoreProfile.deleteOne({ _id: profile._id })
  ]);

  return NextResponse.json({ success: true });
}
