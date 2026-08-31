import EventClient from './client-page';

export default async function EventServerPage({ params }) {
  // In Next.js 15, params is a Promise
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  return <EventClient id={id} />;
}
