import { InstitutionForm } from '@/components/institutions/institution-form';
import { AdminGate } from '@/lib/admin-gate';

export const dynamic = 'force-dynamic';

export default function InstitutionEditPage({ params }: { params: { id: string } }) {
  // `id === 'new'` is a create-mode flag — the form treats
  // `institutionId` as undefined when falsy.
  const isCreate = params.id === 'new';
  return (
    <AdminGate>
      <InstitutionForm institutionId={isCreate ? undefined : params.id} />
    </AdminGate>
  );
}