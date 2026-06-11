import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireSession } from '@/lib/auth-store';
import FacebookConnection from '@/models/FacebookConnection';

export async function POST() {
  const session = await requireSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  await FacebookConnection.findOneAndDelete({ ownerId: session.user.id });
  return NextResponse.json({ success: true });
}
