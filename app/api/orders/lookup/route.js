import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { str } from '@/lib/validators';
import Order from '@/models/Order';

export async function GET(request) {
  const limited = rateLimit(`lookup:${getClientIp(request)}`, { limit: 15, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) return tooManyRequests(NextResponse, limited.retryAfter);

  const { searchParams } = new URL(request.url);
  const contact = str(searchParams.get('contact'), 254);

  if (!contact) {
    return NextResponse.json({ error: 'Phone or email is required.' }, { status: 400 });
  }

  const digits = contact.replace(/\D/g, '');
  const isEmail = contact.includes('@');

  // A contact with no usable digits used to become customerPhone:'' and match every
  // order that was placed without a phone number. Require a real phone/email.
  if (!isEmail && digits.length < 6) {
    return NextResponse.json({ orders: [] });
  }

  await connectToDatabase();

  const query = isEmail
    ? { customerEmail: contact.toLowerCase() }
    : { customerPhone: digits };

  const orders = await Order.find(query).sort({ createdAt: -1 }).limit(50).lean();

  const list = orders.map((order) => ({
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    itemCount: (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
  }));

  return NextResponse.json({ orders: list });
}
