import AppClient from '@/components/AppClient';
import DatabaseSetupScreen from '@/components/DatabaseSetupScreen';
import { auth } from '@/auth';
import { emptyStorePayload, getStorePayloadByOwnerId } from '@/lib/store-service';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }) {
  try {
    const session = await auth();
    const initialData = session?.user?.id
      ? (await getStorePayloadByOwnerId(session.user.id)) || emptyStorePayload()
      : emptyStorePayload();

    return <AppClient initialData={initialData} initialMode="dashboard" authIntent={searchParams?.intent || null} />;
  } catch (error) {
    return <DatabaseSetupScreen errorMessage={error?.message || 'Unable to connect to MongoDB.'} />;
  }
}
