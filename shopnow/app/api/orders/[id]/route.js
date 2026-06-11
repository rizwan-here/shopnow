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
    { $set: { ...(body.sellerNote !== undefined ? { sellerNote: body.sellerNote } : {}) } },
    { new: true }
  );
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json(order);
}


export async function DELETE(request, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await request.json().catch(() => ({}));
  const order = await Order.findOne({ _id: params.id, storeSlug: profile.slug, sellerDeletedAt: null });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (body.orderNumber !== order.orderNumber || body.confirmText !== 'DELETE') {
    return NextResponse.json({ error: 'Double confirmation did not match' }, { status: 400 });
  }

  order.sellerDeletedAt = new Date();
  order.sellerDeletedByAction = 'seller_hidden_record';
  order.timeline = [
    ...(order.timeline || []),
    {
      action: 'seller_hidden_record',
      status: order.status,
      note: 'Seller removed this order record from the app view. Database record was retained.',
      createdAt: new Date()
    }
  ];
  await order.save();

  return NextResponse.json({ ok: true });
}
