import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import StoreProfile from '@/models/StoreProfile';

function generateOrderNumber() {
  const stamp = Date.now().toString().slice(-6);
  return `ORD${stamp}`;
}

export async function POST(request) {
  await connectToDatabase();
  const body = await request.json();
  const store = await StoreProfile.findOne({ slug: body.storeSlug });
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    storeSlug: store.slug,
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    customerPhone: body.customerPhone || '',
    address: body.address,
    source: body.source || 'Direct link',
    buyerNote: body.buyerNote || '',
    paymentMethod: 'Cash on delivery',
    status: 'pending',
    total: Number(body.total),
    items: body.items || [],
    timeline: [
      {
        action: 'created',
        status: 'pending',
        note: `Customer placed a Cash on delivery order${body.source ? ` from ${body.source}` : ''}.`
      }
    ]
  });

  return NextResponse.json(order, { status: 201 });
}
