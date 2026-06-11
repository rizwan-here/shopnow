import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import { getCurrentStoreProfile } from '@/lib/auth-store';

function normalizeStatus(status) {
  if (status === 'processing') return 'packed';
  if (status === 'shipped') return 'out_for_delivery';
  return status || 'pending';
}

const ACTION_MAP = {
  confirm: { status: 'confirmed', note: 'Seller confirmed the order for fulfilment.' },
  pack: { status: 'packed', note: 'Order packed and ready for courier handoff.' },
  dispatch: { status: 'out_for_delivery', note: 'Order handed to courier / rider.' },
  deliver: { status: 'delivered', note: 'Order delivered to the customer.' },
  cancel: { status: 'cancelled', note: 'Order cancelled by the seller.' },
  reopen: { status: 'pending', note: 'Cancelled order reopened for processing.' },
  revert_to_packed: { status: 'packed', note: 'Delivery handoff reverted back to packed stage.' }
};

export async function POST(request, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();
  const action = body.action;
  const mapped = ACTION_MAP[action];

  if (!mapped) {
    return NextResponse.json({ error: 'Unsupported order action' }, { status: 400 });
  }

  const order = await Order.findOne({ _id: params.id, storeSlug: profile.slug });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const currentStatus = normalizeStatus(order.status);
  const nextStatus = mapped.status;

  if (currentStatus === 'delivered' && !['reopen'].includes(action)) {
    return NextResponse.json({ error: 'Delivered orders are already complete' }, { status: 400 });
  }

  order.status = nextStatus;
  order.timeline = [
    ...(order.timeline || []),
    {
      action,
      status: nextStatus,
      note: body.note?.trim() || mapped.note,
      createdAt: new Date()
    }
  ];

  await order.save();
  return NextResponse.json(order);
}
