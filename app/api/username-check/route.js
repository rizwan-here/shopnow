import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import StoreProfile from '@/models/StoreProfile';
import { slugify } from '@/lib/utils';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('username') || '';
  const username = slugify(raw);

  if (!raw.trim()) return NextResponse.json({ available: false, valid: false, normalized: '', message: 'Enter a username.' });
  if (!username || username === 'store' || username === 'api' || username === 'dashboard' || username === 'login' || username === 'signup') {
    return NextResponse.json({ available: false, valid: false, normalized: username, message: 'Choose a different username.' });
  }
  await connectToDatabase();
  const exists = await StoreProfile.findOne({ slug: username }).lean();
  return NextResponse.json({ available: !exists, valid: true, normalized: username, message: exists ? 'Username already taken.' : 'Username is available.' });
}
