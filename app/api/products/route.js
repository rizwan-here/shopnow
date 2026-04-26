import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { slugify } from '@/lib/utils';
import Product from '@/models/Product';
import { getCurrentStoreProfile } from '@/lib/auth-store';

export async function POST(request) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();

  const product = await Product.create({
    name: body.name,
    slug: slugify(body.slug || body.name),
    price: Number(body.price),
    shortDescription: body.shortDescription || '',
    description: body.description || '',
    imageUrl: body.imageUrl || '',
    compareAtPrice: Number(body.compareAtPrice || 0),
    stockQuantity: Number(body.stockQuantity || 0),
    stockStatus: body.stockStatus || 'in_stock',
    featured: Boolean(body.featured),
    sizeOptions: body.sizeOptions || [],
    colorOptions: body.colorOptions || [],
    varieties: Array.isArray(body.varieties) ? body.varieties : [],
    measurements: body.measurements || {},
    deliveryEstimate: body.deliveryEstimate || '',
    returnPolicy: body.returnPolicy || '',
    storeSlug: profile.slug,
    categoryIds: body.categoryIds || []
  });

  return NextResponse.json(product, { status: 201 });
}
