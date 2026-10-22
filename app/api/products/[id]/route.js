import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/models/Product';
import { getCurrentStoreProfile } from '@/lib/auth-store';
import { readJson, safeImageRef } from '@/lib/validators';

export async function PATCH(request, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  if (body.imageUrl !== undefined) {
    const cleaned = safeImageRef(body.imageUrl || '');
    if (cleaned === null) return NextResponse.json({ error: 'Invalid image URL.' }, { status: 400 });
    body.imageUrl = cleaned;
  }
  if (Array.isArray(body.varieties)) {
    for (const v of body.varieties) {
      if (v && v.imageUrl && safeImageRef(v.imageUrl) === null) {
        return NextResponse.json({ error: 'Invalid variety image URL.' }, { status: 400 });
      }
    }
  }

  const product = await Product.findOneAndUpdate(
    { _id: params.id, storeSlug: profile.slug },
    {
      $set: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body.shortDescription !== undefined ? { shortDescription: body.shortDescription } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.compareAtPrice !== undefined ? { compareAtPrice: Number(body.compareAtPrice) } : {}),
        ...(body.stockQuantity !== undefined ? { stockQuantity: Number(body.stockQuantity) } : {}),
        ...(body.stockStatus !== undefined ? { stockStatus: body.stockStatus } : {}),
        ...(body.featured !== undefined ? { featured: Boolean(body.featured) } : {}),
        ...(body.sizeOptions !== undefined ? { sizeOptions: body.sizeOptions } : {}),
        ...(body.colorOptions !== undefined ? { colorOptions: body.colorOptions } : {}),
        ...(body.varieties !== undefined ? { varieties: body.varieties } : {}),
        ...(body.measurements !== undefined ? { measurements: body.measurements } : {}),
        ...(body.deliveryEstimate !== undefined ? { deliveryEstimate: body.deliveryEstimate } : {}),
        ...(body.returnPolicy !== undefined ? { returnPolicy: body.returnPolicy } : {}),
        ...(body.categoryIds !== undefined ? { categoryIds: body.categoryIds } : {})
      }
    },
    { new: true, runValidators: true }
  );

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(_, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  await Product.findOneAndDelete({ _id: params.id, storeSlug: profile.slug });
  return NextResponse.json({ success: true });
}
