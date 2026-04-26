import AppClient from '@/components/AppClient';
import { emptyStorePayload } from '@/lib/store-service';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <AppClient initialData={emptyStorePayload()} initialMode="landing" />;
}
