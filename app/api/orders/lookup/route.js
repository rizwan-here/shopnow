import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const contact = (searchParams.get('contact') || '').trim();

  if (!contact) {
    return NextResponse.json({ error: 'Phone or email is required.' }, { status: 400 });
  }

  await connectToDatabase();

  const digits = contact.replace(/\D/g, '');
  const isEmail = contact.includes('@');

  const query = isEmail
    ? { customerEmail: contact.toLowerCase() }
    : { customerPhone: digits };

  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

  const list = orders.map((order) => ({
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    itemCount: (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
  }));

  return NextResponse.json({ orders: list });
}
