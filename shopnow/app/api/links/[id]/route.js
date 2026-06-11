import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import StoreLink from '@/models/StoreLink';
import { getCurrentStoreProfile } from '@/lib/auth-store';

export async function DELETE(_, { params }) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  await StoreLink.findOneAndDelete({ _id: params.id, storeSlug: profile.slug });
  return NextResponse.json({ success: true });
}
