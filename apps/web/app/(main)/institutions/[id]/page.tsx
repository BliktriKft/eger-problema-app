import { InstitutionDetail } from '@/components/institutions/institution-detail';

export const dynamic = 'force-dynamic';

export default function InstitutionDetailPage({ params }: { params: { id: string } }) {
  return <InstitutionDetail id={params.id} />;
}