import { redirect } from 'next/navigation';
import AppClient from '@/components/AppClient';
import DatabaseSetupScreen from '@/components/DatabaseSetupScreen';
import { auth } from '@/auth';
import { emptyStorePayload, getStorePayloadByOwnerId } from '@/lib/store-service';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }) {
  try {
    // Next.js 15: searchParams is a Promise and must be awaited
    const resolvedParams = await searchParams;
    const intent = resolvedParams?.intent || null;

    const session = await auth();
    const initialData = session?.user?.id
      ? (await getStorePayloadByOwnerId(session.user.id)) || emptyStorePayload()
      : emptyStorePayload();

    // If the user arrives with intent=signup but already has a store,
    // redirect server-side to /dashboard (no intent) so they land on their dashboard.
    // This handles the case where a deleted store's session/state is stale,
    // or where the user signed up twice with the same Google account.
    if (intent === 'signup' && initialData?.profile) {
      redirect('/dashboard');
    }

    return <AppClient initialData={initialData} initialMode="dashboard" authIntent={intent} />;
  } catch (error) {
    return <DatabaseSetupScreen errorMessage={error?.message || 'Unable to connect to MongoDB.'} />;
  }
}
