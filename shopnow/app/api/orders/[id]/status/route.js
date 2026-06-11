import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import { getCurrentStoreProfile } from '@/lib/auth-store';

export async function PATCH(request, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();
  const order = await Order.findOneAndUpdate(
    { _id: params.id, storeSlug: profile.slug },
    { $set: { status: body.status } },
    { new: true }
  );

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json(order);
}
