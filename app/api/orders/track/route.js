import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = (searchParams.get('orderNumber') || '').trim().toUpperCase();
  const contact = (searchParams.get('contact') || '').trim();

  if (!orderNumber || !contact) {
    return NextResponse.json({ error: 'Order number and phone or email are required.' }, { status: 400 });
  }

  await connectToDatabase();

  const order = await Order.findOne({ orderNumber });
  if (!order) {
    return NextResponse.json({ error: 'Order not found. Please check your order number.' }, { status: 404 });
  }

  const emailMatch = order.customerEmail && order.customerEmail.toLowerCase() === contact.toLowerCase();
  const phoneMatch = order.customerPhone && order.customerPhone.replace(/\D/g, '') === contact.replace(/\D/g, '');

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
