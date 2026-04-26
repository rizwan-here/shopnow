import AppClient from '@/components/AppClient';
import DatabaseSetupScreen from '@/components/DatabaseSetupScreen';
import { getStorePayloadBySlug } from '@/lib/store-service';

export const dynamic = 'force-dynamic';

export default async function StorefrontPage({ params }) {
  try {
    const initialData = await getStorePayloadBySlug(params.slug);
    if (!initialData) {
      return <DatabaseSetupScreen errorMessage="Store not found." />;
    }
    return <AppClient initialData={initialData} initialMode="storefront" storeSlugOverride={params.slug} />;
  } catch (error) {
    return <DatabaseSetupScreen errorMessage={error?.message || 'Unable to connect to MongoDB.'} />;
  }
}
