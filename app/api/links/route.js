import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import StoreLink from '@/models/StoreLink';
import { getCurrentStoreProfile } from '@/lib/auth-store';

export async function POST(request) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();
  const link = await StoreLink.create({
    title: body.title,
    url: body.url,
    storeSlug: profile.slug
  });

  return NextResponse.json(link, { status: 201 });
}
