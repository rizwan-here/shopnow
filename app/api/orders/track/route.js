import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { str } from '@/lib/validators';
import Order from '@/models/Order';

export async function GET(request) {
  const limited = rateLimit(`track:${getClientIp(request)}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) return tooManyRequests(NextResponse, limited.retryAfter);

  const { searchParams } = new URL(request.url);
  const orderNumber = str(searchParams.get('orderNumber'), 40).toUpperCase();
  const contact = str(searchParams.get('contact'), 254);

  if (!orderNumber || !contact) {
    return NextResponse.json({ error: 'Order number and phone or email are required.' }, { status: 400 });
  }

  await connectToDatabase();

  const order = await Order.findOne({ orderNumber });
  if (!order) {
    return NextResponse.json({ error: 'Order not found. Please check your order number.' }, { status: 404 });
  }

  const emailMatch = order.customerEmail && order.customerEmail.toLowerCase() === contact.toLowerCase();
  const contactDigits = contact.replace(/\D/g, '');
  const phoneMatch = order.customerPhone && contactDigits.length >= 6 && order.customerPhone.replace(/\D/g, '') === contactDigits;

  if (!emailMatch && !phoneMatch) {
    return NextResponse.json({ error: 'Order number and contact details do not match.' }, { status: 403 });
  }

  const safe = {
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    address: order.address,
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      imageUrl: item.imageUrl || '',
      selectedOptions: item.selectedOptions
    })),
    productTotal: order.productTotal || order.total,
    deliveryCharge: order.deliveryCharge || 0,
    deliveryZone: order.deliveryZone || 'inside',
    total: order.total,
    buyerNote: order.buyerNote,
    createdAt: order.createdAt,
    timeline: (order.timeline || []).map(event => ({
      status: event.status,
      note: event.note,
      createdAt: event.createdAt
    }))
  };

  return NextResponse.json(safe);
}
