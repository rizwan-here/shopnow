import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireSession } from '@/lib/auth-store';
import FacebookConnection from '@/models/FacebookConnection';
import Product from '@/models/Product';
import StoreProfile from '@/models/StoreProfile';

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || 'http://localhost:3000';
}

function formatMoney(value = 0, currencyCode = 'BDT') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  } catch {
    return `${currencyCode} ${Number(value || 0)}`;
  }
}

function buildProductCaption({ product, profile }) {
  const storefrontUrl = `${getBaseUrl()}/${profile.slug}`;
  const lines = [
    `✨ ${product.name}`,
    product.shortDescription || product.description || '',
    `Price: ${formatMoney(product.price, profile.currencyCode || 'BDT')}`,
    product.sizeOptions?.length ? `Sizes: ${product.sizeOptions.join(', ')}` : '',
    product.colorOptions?.length ? `Colors: ${product.colorOptions.join(', ')}` : '',
    product.deliveryEstimate || profile.defaultDeliveryEstimate ? `Delivery: ${product.deliveryEstimate || profile.defaultDeliveryEstimate}` : '',
    `Order here: ${storefrontUrl}`
  ];
  return lines.filter(Boolean).join('\n');
}

export async function POST(request) {
  const session = await requireSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId, caption: captionOverride } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  await connectToDatabase();
  const [connection, profile] = await Promise.all([
    FacebookConnection.findOne({ ownerId: session.user.id }),
    StoreProfile.findOne({ ownerId: session.user.id })
  ]);

  if (!profile) {
    return NextResponse.json({ error: 'Store profile not found' }, { status: 404 });
  }
  if (!connection?.selectedPageId) {
    return NextResponse.json({ error: 'Connect a Facebook Page first' }, { status: 400 });
  }

  const selectedPage = connection.pages.find((page) => page.pageId === connection.selectedPageId);
  if (!selectedPage?.accessToken) {
    return NextResponse.json({ error: 'Selected Facebook Page token is missing. Please reconnect the page.' }, { status: 400 });
  }

  const product = await Product.findOne({ _id: productId, storeSlug: profile.slug });
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const caption = String(captionOverride || '').trim() || buildProductCaption({ product, profile });

  try {
    let postResponse;
    if (product.imageUrl) {
      const params = new URLSearchParams({
        url: product.imageUrl,
        caption,
        published: 'true',
        access_token: selectedPage.accessToken
      });
      postResponse = await fetch(`https://graph.facebook.com/v21.0/${selectedPage.pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
    } else {
      const params = new URLSearchParams({
        message: caption,
        access_token: selectedPage.accessToken
      });
      postResponse = await fetch(`https://graph.facebook.com/v21.0/${selectedPage.pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
    }

    const result = await postResponse.json();
    if (!postResponse.ok || result.error) {
      throw new Error(result?.error?.message || 'Could not publish to Facebook');
    }

    return NextResponse.json({ success: true, postId: result.id, pageName: connection.selectedPageName });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not publish to Facebook' }, { status: 500 });
  }
}
