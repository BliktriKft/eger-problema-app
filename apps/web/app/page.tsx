import { redirect } from 'next/navigation';

export default function RootIndex() {
  // MVP: the map is the primary surface, so the root immediately sends
  // the visitor there.  Authenticated users land at /map; signed-out
  // visitors see the public map (filters, FAB, OAuth buttons).
  redirect('/map');
}
