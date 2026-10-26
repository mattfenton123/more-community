import EventClient from './client-page';
import { initialExperiences } from '../../../src/lib/constants';
import { supabase } from '../../../src/lib/supabaseClient';
import { formatEventDate } from '../../../src/lib/recurrence';
import { SITE_ORIGIN, getEventUrl, eventMatchesSlug, isUuidLike, parseSlugDate } from '../../../src/lib/eventLinks';

const EVENT_SELECT = '*, communities(name, image)';

// Resolve the URL segment to an event. It can be a clean slug
// (bewl-water-community-walk-31st-october-2026) or a legacy id / UUID.
async function loadEventForParam(param) {
  const byId = async () => {
    const { data } = await supabase.from('events').select(EVENT_SELECT).eq('id', param).maybeSingle();
    return data || null;
  };

  if (isUuidLike(param)) return byId();

  // Slug: narrow by the date embedded in the slug, then match title + date.
  const isoDate = parseSlugDate(param);
  if (isoDate) {
    const { data: sameDay } = await supabase.from('events').select(EVENT_SELECT).eq('date', isoDate);
    const hit = (sameDay || []).find(e => eventMatchesSlug(e, param));
    if (hit) return hit;
  }
  const { data: rows } = await supabase.from('events').select(EVENT_SELECT).limit(1000);
  const hit = (rows || []).find(e => eventMatchesSlug(e, param));
  return hit || byId();
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  // 1. Fetch live event and host community from Supabase
  let event = null;
  let communityName = 'More Community';

  try {
    const dbEvent = await loadEventForParam(id);

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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || SITE_ORIGIN;
  const ogUrl = new URL(`${baseUrl}/api/og`);
  ogUrl.searchParams.set('title', event.title);
  ogUrl.searchParams.set('community', communityName);
  ogUrl.searchParams.set('type', 'event');
  ogUrl.searchParams.set('date', event.date ? `${formatEventDate(event.date)}${event.time ? ` at ${event.time}` : ''}` : (event.duration || ''));
  if (event.location) ogUrl.searchParams.set('location', event.location);
  const eventImg = event.image || event.communities?.image;
  if (eventImg) {
    ogUrl.searchParams.set('image', eventImg.startsWith('http') ? eventImg : `${baseUrl}${eventImg}`);
  }

  const desc = event.description || `Join us for ${event.title} with ${communityName} on More Community. RSVP, view event details, and connect with your local community in real life.`;
  const canonicalUrl = getEventUrl(event, { origin: baseUrl });

  return {
    title: `${event.title} | ${communityName}`,
    description: desc,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${event.title} | ${communityName}`,
      description: desc,
      url: canonicalUrl,
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
