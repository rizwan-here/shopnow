import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import { getCurrentStoreProfile } from '@/lib/auth-store';
import { readJson } from '@/lib/validators';

const ALLOWED_STATUSES = ['pending', 'processing', 'shipped', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

export async function PATCH(request, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await readJson(request);
  if (!body || !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
  }
  const order = await Order.findOneAndUpdate(
    { _id: params.id, storeSlug: profile.slug },
    { $set: { status: body.status } },
    { new: true }
  );

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json(order);
}
