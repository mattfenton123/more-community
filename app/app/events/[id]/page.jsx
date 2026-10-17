import EventClient from './client-page';
import { initialExperiences } from '../../../src/lib/constants';
import { supabase } from '../../../src/lib/supabaseClient';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  // 1. Fetch live event and host community from Supabase
  let event = null;
  let communityName = 'More Community';

  try {
    const { data: dbEvent } = await supabase
      .from('events')
      .select('*, communities(name, image)')
      .eq('id', id)
      .maybeSingle();

    if (dbEvent) {
      event = dbEvent;
      if (dbEvent.communities?.name) {
        communityName = dbEvent.communities.name;
      }
    }
  } catch (err) {
    console.error('Error fetching event metadata:', err);
  }

  // 2. Fallback to initialExperiences if mock ID
  if (!event) {
    event = initialExperiences.find(e => e.id === id);
  }
  
  if (!event) {
    return {
      title: 'Community Event | More Community',
      description: 'Discover events, connect with local people, and experience real-life community.'
    };
  }

  // Construct OG image URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
  const ogUrl = new URL(`${baseUrl}/api/og`);
  ogUrl.searchParams.set('title', event.title);
  ogUrl.searchParams.set('community', communityName);
  ogUrl.searchParams.set('type', 'event');
  ogUrl.searchParams.set('date', event.date ? `${event.date}${event.time ? ` at ${event.time}` : ''}` : (event.duration || ''));
  if (event.location) ogUrl.searchParams.set('location', event.location);
  const eventImg = event.image || event.communities?.image;
  if (eventImg) {
    ogUrl.searchParams.set('image', eventImg.startsWith('http') ? eventImg : `${baseUrl}${eventImg}`);
  }

  const desc = event.description || `Join us for ${event.title} with ${communityName} on More Community. RSVP, view event details, and connect with your local community in real life.`;

  return {
    title: `${event.title} | ${communityName}`,
    description: desc,
    openGraph: {
      title: `${event.title} | ${communityName}`,
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
