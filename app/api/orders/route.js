import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import StoreProfile from '@/models/StoreProfile';

async function generateOrderNumber() {
  const prefix = 'ORD';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const candidate = `${prefix}${stamp}${random}`;
  const exists = await Order.findOne({ orderNumber: candidate });
  if (exists) {
    const fallback = `${prefix}${Date.now().toString(36).toUpperCase()}`;
    return fallback;
  }
  return candidate;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export async function POST(request) {
  await connectToDatabase();
  const body = await request.json();

  if (!validateEmail(body.customerEmail)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const store = await StoreProfile.findOne({ slug: body.storeSlug });
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  // Determine delivery charge based on zone
  const zone = body.deliveryZone || 'inside';
  let deliveryCharge = 0;
  const productTotal = Number(body.productTotal || body.total || 0);
  const freeThreshold = Number(store.freeDeliveryThreshold || 0);

  if (freeThreshold > 0 && productTotal >= freeThreshold) {
    deliveryCharge = 0;
  } else if (zone === 'outside') {
    deliveryCharge = Number(store.deliveryOutsideDhaka || 0);
  } else {
    deliveryCharge = Number(store.deliveryInsideDhaka || 0);
  }

  const total = productTotal + deliveryCharge;
  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    storeSlug: store.slug,
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    customerPhone: body.customerPhone || '',
    address: body.address,
    source: body.source || 'Direct link',
    buyerNote: body.buyerNote || '',
    paymentMethod: 'Cash on delivery',
    status: 'pending',
    deliveryZone: zone,
    deliveryCharge,
    productTotal,
    total,
    items: body.items || [],
    timeline: [
      {
        action: 'created',
        status: 'pending',
        note: `Customer placed a Cash on delivery order${body.source ? ` from ${body.source}` : ''}. Delivery: ${zone === 'outside' ? 'Outside Dhaka' : 'Inside Dhaka'}.`
      }
    ]
  });

  // Decrement stock quantities for ordered items
  for (const item of body.items || []) {
    if (item.productId) {
      const product = await Product.findById(item.productId);
      if (product) {
        const newQty = Math.max(0, (product.stockQuantity || 0) - (item.quantity || 1));
        const newStatus = newQty === 0 ? 'stock_out' : newQty <= 3 ? 'low_stock' : product.stockStatus;
        await Product.findByIdAndUpdate(item.productId, {
          $set: { stockQuantity: newQty, stockStatus: newStatus }
        });
      }
    }
  }

  return NextResponse.json(order, { status: 201 });
}
