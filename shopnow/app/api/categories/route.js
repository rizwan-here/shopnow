import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { slugify } from '@/lib/utils';
import Category from '@/models/Category';
import { getCurrentStoreProfile } from '@/lib/auth-store';

export async function POST(request) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();
  const category = await Category.create({
    name: body.name,
    slug: slugify(body.slug || body.name),
    storeSlug: profile.slug
  });

  return NextResponse.json(category, { status: 201 });
}
