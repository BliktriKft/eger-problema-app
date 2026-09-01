import { InstitutionsAdminScreen } from '@/components/institutions/institutions-screen';
import { AdminGate } from '@/lib/admin-gate';

export const dynamic = 'force-dynamic';

export default function InstitutionsAdminPage() {
  return (
    <AdminGate>
      <InstitutionsAdminScreen />
    </AdminGate>
  );
}