import EventClient from './client-page';
import { initialExperiences } from '../../../src/lib/constants';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  // Find the event from constants (or fetch from DB in future)
  const event = initialExperiences.find(e => e.id === id);
  
  if (!event) {
    return {
      title: 'Community Event | more.',
    };
  }

  // Construct OG image URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
  const ogUrl = new URL(`${baseUrl}/api/og`);
  ogUrl.searchParams.set('title', event.title);
  ogUrl.searchParams.set('type', 'event');
  ogUrl.searchParams.set('date', event.date ? `${event.date}${event.time ? ` at ${event.time}` : ''}` : (event.duration || ''));
  if (event.location) ogUrl.searchParams.set('location', event.location);
  if (event.image) {
    ogUrl.searchParams.set('image', event.image.startsWith('http') ? event.image : `${baseUrl}${event.image}`);
  }

  return {
    title: `${event.title} | more.`,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description,
      images: [ogUrl.toString()],
    },
  };
}

export default async function EventServerPage({ params }) {
  // In Next.js 15, params is a Promise
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  return <EventClient id={id} />;
}
