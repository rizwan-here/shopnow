import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { emptyStorePayload, getStorePayloadByOwnerId, getStorePayloadBySlug } from '@/lib/store-service';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || undefined;

  if (slug) {
    const data = await getStorePayloadBySlug(slug);
    return NextResponse.json(data || emptyStorePayload());
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(emptyStorePayload());
  }

  const data = await getStorePayloadByOwnerId(session.user.id);
  return NextResponse.json(data || emptyStorePayload());
}
