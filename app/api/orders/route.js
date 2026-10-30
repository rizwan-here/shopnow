import crypto from 'crypto';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { readJson, str } from '@/lib/validators';
import Order from '@/models/Order';
import Product from '@/models/Product';
import StoreProfile from '@/models/StoreProfile';

const MAX_ITEMS = 50;
const MAX_QTY = 100;

// Cryptographically random, unguessable order number (was Math.random + timestamp).
function generateOrderNumber() {
  return `ORD${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function badRequest(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function releaseStock(reserved) {
  await Promise.all(
    reserved.map(({ productId, qty }) =>
      Product.updateOne({ _id: productId }, { $inc: { stockQuantity: qty } }).catch(() => {})
    )
  );
}

export async function POST(request) {
  const limited = rateLimit(`orders:${getClientIp(request)}`, { limit: 15, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) return tooManyRequests(NextResponse, limited.retryAfter);

  await connectToDatabase();
  const body = await readJson(request);
  if (!body) return badRequest('Invalid request body.');

  const customerEmail = str(body.customerEmail, 254).toLowerCase();
  if (!validateEmail(customerEmail)) return badRequest('A valid email address is required.');

  const customerName = str(body.customerName, 120);
  const address = str(body.address, 500);
  if (!customerName || !address) return badRequest('Name and address are required.');

  // str() guarantees a plain string, so operator objects like {"$ne":null} cannot reach the query.
  const store = await StoreProfile.findOne({ slug: str(body.storeSlug, 100) });
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  // ---- Validate cart lines -------------------------------------------------
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) return badRequest('Your cart is empty.');
  if (rawItems.length > MAX_ITEMS) return badRequest('Too many items in one order.');

  const lines = [];
  for (const raw of rawItems) {
    const productId = str(raw?.productId, 40);
    if (!mongoose.isValidObjectId(productId)) return badRequest('Invalid product in cart.');
    const qty = Math.floor(Number(raw?.quantity ?? 1));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) return badRequest('Invalid item quantity.');
    lines.push({ productId, qty, raw });
  }

  // ---- Load authoritative product data (price, name) from the DB ------------
  const uniqueIds = [...new Set(lines.map((l) => l.productId))];
  const products = await Product.find({ _id: { $in: uniqueIds }, storeSlug: store.slug });
  const productById = new Map(products.map((p) => [String(p._id), p]));
  if (productById.size !== uniqueIds.length) {
    return badRequest('One or more items are no longer available in this store.', 409);
  }

  const qtyByProduct = new Map();
  const orderItems = [];
  let productTotal = 0;

  for (const line of lines) {
    const product = productById.get(line.productId);
    if (product.stockStatus === 'stock_out') {
      return badRequest(`"${product.name}" is out of stock.`, 409);
    }
    qtyByProduct.set(line.productId, (qtyByProduct.get(line.productId) || 0) + line.qty);

    // Only accept a client image if it is one of the product's own images.
    const knownImages = new Set([product.imageUrl, ...(product.varieties || []).map((v) => v.imageUrl)].filter(Boolean));
    const clientImage = str(line.raw?.imageUrl, 2000);
    const opts = line.raw?.selectedOptions && typeof line.raw.selectedOptions === 'object' ? line.raw.selectedOptions : {};

    orderItems.push({
      productId: product._id,
      name: product.name,
      price: product.price, // server-side price: client-supplied price is ignored
      quantity: line.qty,
      imageUrl: knownImages.has(clientImage) ? clientImage : product.imageUrl || '',
      selectedOptions: {
        size: str(opts.size, 100),
        color: str(opts.color, 100),
        varietyName: str(opts.varietyName, 100)
      }
    });
    productTotal += product.price * line.qty;
  }

  // ---- Delivery charge + total (server-computed) ---------------------------
  const zone = body.deliveryZone === 'outside' ? 'outside' : 'inside';
  const freeThreshold = Number(store.freeDeliveryThreshold || 0);
  let deliveryCharge;
  if (freeThreshold > 0 && productTotal >= freeThreshold) {
    deliveryCharge = 0;
  } else if (zone === 'outside') {
    deliveryCharge = Number(store.deliveryOutsideDhaka || 0);
  } else {
    deliveryCharge = Number(store.deliveryInsideDhaka || 0);
  }
  const total = productTotal + deliveryCharge;

  // ---- Atomically reserve stock (no read-then-write race / overselling) ----
  const reserved = [];
  for (const [productId, qty] of qtyByProduct) {
    const product = productById.get(productId);
    if (!(product.stockQuantity > 0)) continue; // quantity not tracked: legacy behaviour
    const updated = await Product.findOneAndUpdate(
      { _id: productId, storeSlug: store.slug, stockStatus: { $ne: 'stock_out' }, stockQuantity: { $gte: qty } },
      { $inc: { stockQuantity: -qty } },
      { new: true }
    );
    if (!updated) {
      await releaseStock(reserved);
      return badRequest(`Not enough stock for "${product.name}".`, 409);
    }
    reserved.push({ productId, qty });
  }

  // ---- Create the order ----------------------------------------------------
  const source = str(body.source, 100) || 'Direct link';
  let order = null;
  for (let attempt = 0; attempt < 3 && !order; attempt += 1) {
    try {
      order = await Order.create({
        orderNumber: generateOrderNumber(),
        storeSlug: store.slug,
        customerName,
        customerEmail,
        customerPhone: str(body.customerPhone, 30),
        address,
        source,
        buyerNote: str(body.buyerNote, 1000),
        paymentMethod: 'Cash on delivery',
        status: 'pending',
        deliveryZone: zone,
        deliveryCharge,
        productTotal,
        total,
        items: orderItems,
        timeline: [
          {
            action: 'created',
            status: 'pending',
            note: `Customer placed a Cash on delivery order${body.source ? ` from ${source}` : ''}. Delivery: ${zone === 'outside' ? 'Outside Dhaka' : 'Inside Dhaka'}.`
          }
        ]
      });
    } catch (error) {
      if (error?.code === 11000 && attempt < 2) continue; // order-number collision: retry
      await releaseStock(reserved);
      if (error?.name === 'ValidationError') return badRequest('Order details are invalid.');
      console.error('Order creation failed:', error);
      return NextResponse.json({ error: 'Could not place order.' }, { status: 500 });
    }
  }

  // ---- Update stock status labels for reserved products --------------------
  for (const { productId } of reserved) {
    const fresh = await Product.findById(productId).select('stockQuantity');
    if (!fresh) continue;
    const q = fresh.stockQuantity;
    const status = q === 0 ? 'stock_out' : q <= 3 ? 'low_stock' : null;
    if (status) await Product.updateOne({ _id: productId, stockQuantity: q }, { $set: { stockStatus: status } });
  }
  // Products with untracked (0) quantity flip to stock_out after an order, as before.
  for (const [productId] of qtyByProduct) {
    if (!(productById.get(productId).stockQuantity > 0)) {
      await Product.updateOne({ _id: productId }, { $set: { stockStatus: 'stock_out' } });
    }
  }

  return NextResponse.json(order, { status: 201 });
}
