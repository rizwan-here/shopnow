import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import StoreLink from '@/models/StoreLink';
import { getCurrentStoreProfile } from '@/lib/auth-store';
import { readJson, safeHttpUrl, str } from '@/lib/validators';

export async function POST(request) {
  const { profile } = await getCurrentStoreProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = (await readJson(request)) || {};
  const url = safeHttpUrl(body.url);
  const title = str(body.title, 200);
  if (!url || !title) {
    return NextResponse.json({ error: 'A title and a valid http(s) URL are required.' }, { status: 400 });
  }
  const link = await StoreLink.create({
    title,
    url,
    storeSlug: profile.slug
  });

  return NextResponse.json(link, { status: 201 });
}
