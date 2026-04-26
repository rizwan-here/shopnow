import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/mongodb';
import StoreProfile from '@/models/StoreProfile';

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export async function getCurrentStoreProfile() {
  const session = await requireSession();
  if (!session) return { session: null, profile: null };
  await connectToDatabase();
  const profile = await StoreProfile.findOne({ ownerId: session.user.id });
  return { session, profile };
}
