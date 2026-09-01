import { ProblemForm } from '@/components/problems/ProblemForm';

export const dynamic = 'force-dynamic';

export default function SubmitPage({ searchParams }: { searchParams?: { lat?: string; lng?: string } }) {
  const lat = parseFloat(searchParams?.lat ?? '');
  const lng = parseFloat(searchParams?.lng ?? '');
  const initialLocation =
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { latitude: lat, longitude: lng }
      : undefined;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted-50">
      <ProblemForm initialLocation={initialLocation} />
    </div>
  );
}
