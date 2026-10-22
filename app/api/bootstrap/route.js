import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { emptyStorePayload, getStorePayloadByOwnerId, getStorePayloadBySlug } from '@/lib/store-service';
import { str } from '@/lib/validators';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = str(searchParams.get('slug') || '', 100) || undefined;

  const session = await auth();
  const viewerId = session?.user?.id || null;

  if (slug) {
    // Public storefront data for everyone; orders/PII only when the viewer owns this store.
    const data = await getStorePayloadBySlug(slug, viewerId);
    return NextResponse.json(data || emptyStorePayload());
  }

  if (!viewerId) {
    return NextResponse.json(emptyStorePayload());
  }

  const data = await getStorePayloadByOwnerId(viewerId);
  return NextResponse.json(data || emptyStorePayload());
}
