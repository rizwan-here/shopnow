import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { slugify } from '@/lib/utils';
import StoreProfile from '@/models/StoreProfile';

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const existing = await StoreProfile.findOne({ ownerId: session.user.id });
  if (existing) {
    return NextResponse.json({ error: 'Store already exists.' }, { status: 409 });
  }

  const body = await request.json();
  const username = slugify(body.username || '');
  const storeName = String(body.storeName || '').trim() || `${session.user.name || username}'s shop`;

  if (!username || username === 'store') {
    return NextResponse.json({ error: 'Choose a valid username.' }, { status: 400 });
  }

  const taken = await StoreProfile.findOne({ slug: username });
  if (taken) {
    return NextResponse.json({ error: 'This username is already taken.' }, { status: 409 });
  }

  const profile = await StoreProfile.create({
    ownerId: session.user.id,
    ownerEmail: session.user.email || '',
    ownerName: session.user.name || '',
    storeName,
    slug: username,
    paymentMethods: ['Cash on delivery'],
    deliveryInsideDhaka: 80,
    deliveryOutsideDhaka: 140,
    freeDeliveryThreshold: 0,
    defaultDeliveryEstimate: '1-3 days inside Dhaka, 3-5 days outside Dhaka',
    exchangePolicy: 'Exchange available subject to seller approval. Please confirm before ordering.'
  });

  return NextResponse.json({ success: true, profile }, { status: 201 });
}
