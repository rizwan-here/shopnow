import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { slugify } from '@/lib/utils';
import { getCurrentStoreProfile } from '@/lib/auth-store';

export async function PATCH(request, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();
  const category = await Category.findOneAndUpdate(
    { _id: params.id, storeSlug: profile.slug },
    {
      $set: {
        ...(body.name !== undefined ? { name: body.name, slug: slugify(body.name) } : {})
      }
    },
    { new: true }
  );

  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  return NextResponse.json(category);
}

export async function DELETE(_, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  await Product.updateMany({ storeSlug: profile.slug, categoryIds: params.id }, { $pull: { categoryIds: params.id } });
  await Category.findOneAndDelete({ _id: params.id, storeSlug: profile.slug });
  return NextResponse.json({ success: true });
}
