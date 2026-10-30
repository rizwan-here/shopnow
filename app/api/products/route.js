import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { slugify } from '@/lib/utils';
import Product from '@/models/Product';
import { getCurrentStoreProfile } from '@/lib/auth-store';
import { readJson, safeImageRef } from '@/lib/validators';

export async function POST(request) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  const imageUrl = safeImageRef(body.imageUrl || '');
  if (imageUrl === null) return NextResponse.json({ error: 'Invalid image URL.' }, { status: 400 });
  const varieties = Array.isArray(body.varieties) ? body.varieties : [];
  for (const v of varieties) {
    if (v && v.imageUrl && safeImageRef(v.imageUrl) === null) {
      return NextResponse.json({ error: 'Invalid variety image URL.' }, { status: 400 });
    }
  }

  const product = await Product.create({
    name: typeof body.name === 'string' ? body.name : '',
    slug: slugify(typeof body.slug === 'string' && body.slug ? body.slug : typeof body.name === 'string' ? body.name : ''),
    price: Number(body.price),
    shortDescription: body.shortDescription || '',
    description: body.description || '',
    imageUrl,
    compareAtPrice: Number(body.compareAtPrice || 0),
    stockQuantity: Number(body.stockQuantity || 0),
    stockStatus: body.stockStatus || 'in_stock',
    featured: Boolean(body.featured),
    sizeOptions: body.sizeOptions || [],
    colorOptions: body.colorOptions || [],
    varieties,
    measurements: body.measurements || {},
    deliveryEstimate: body.deliveryEstimate || '',
    returnPolicy: body.returnPolicy || '',
    storeSlug: profile.slug,
    categoryIds: body.categoryIds || []
  });

  return NextResponse.json(product, { status: 201 });
}
