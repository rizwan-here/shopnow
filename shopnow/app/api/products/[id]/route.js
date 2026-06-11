import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/models/Product';
import { getCurrentStoreProfile } from '@/lib/auth-store';

export async function PATCH(request, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();

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
    { new: true }
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
