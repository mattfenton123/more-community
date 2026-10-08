import EventClient from './client-page';
import { initialExperiences } from '../../../src/lib/constants';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  // Find the event from constants (or fetch from DB in future)
  const event = initialExperiences.find(e => e.id === id);
  
  if (!event) {
    return {
      title: 'Community Event | More Community',
    };
  }

  // Construct OG image URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
  const ogUrl = new URL(`${baseUrl}/api/og`);
  ogUrl.searchParams.set('title', event.title);
  ogUrl.searchParams.set('community', 'More Community');
  ogUrl.searchParams.set('type', 'event');
  ogUrl.searchParams.set('date', event.date ? `${event.date}${event.time ? ` at ${event.time}` : ''}` : (event.duration || ''));
  if (event.location) ogUrl.searchParams.set('location', event.location);
  if (event.image) {
    ogUrl.searchParams.set('image', event.image.startsWith('http') ? event.image : `${baseUrl}${event.image}`);
  }

  const desc = event.description || `Join us for ${event.title} on More Community. RSVP, view event details, and connect with your local community in real life.`;

  return {
    title: `${event.title} | More Community`,
    description: desc,
    openGraph: {
      title: `${event.title} | More Community`,
      description: desc,
      siteName: 'More Community',
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
      title: `${event.title} | More Community`,
      description: desc,
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
