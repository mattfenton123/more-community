import { createClient } from '@supabase/supabase-js';
import { initialExperiences } from '../../../../src/lib/constants';
import { parseEventDateTime } from '../../../../src/lib/calendar';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';
const supabase = createClient(supabaseUrl, supabaseKey);

function formatIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const { communityId } = resolvedParams;

  if (!communityId) {
    return new Response('Missing community ID', { status: 400 });
  }

  // Fetch community data
  let community = null;
  const { data: dbComm } = await supabase.from('communities').select('*').eq('id', communityId).maybeSingle();
  if (dbComm) {
    community = dbComm;
  }

  const communityName = community?.name || 'More Community';
  const communityDesc = community?.description || '';

  // Fetch published events
  let events = [];
  const { data: dbEvents } = await supabase
    .from('events')
    .select('*')
    .eq('community_id', communityId)
    .neq('status', 'cancelled')
    .order('date', { ascending: true });

  if (dbEvents && dbEvents.length > 0) {
    events = dbEvents.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      time: e.time,
      location: e.location,
      ticketPrice: e.ticket_price || 0,
      image: e.image
    }));
  } else {
    events = initialExperiences.filter(e => e.communityId === communityId);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
  const now = new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//more. Community//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(communityName)}`,
    `X-WR-CALDESC:${escapeIcsText(communityDesc)}`,
    'X-WR-TIMEZONE:Europe/London',
    'REFRESH-INTERVAL;VALUE=DURATION:PT3H',
    'X-PUBLISHED-TTL:PT3H',
  ];

  events.forEach(event => {
    const startTime = parseEventDateTime(event.date, event.time) || new Date(event.date);
    // Default duration 2 hours
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    const eventUrl = `${baseUrl}/events/${event.id}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:more-${event.id}@morecommunity.app`);
    lines.push(`DTSTAMP:${formatIcsDate(now)}`);
    lines.push(`DTSTART:${formatIcsDate(startTime)}`);
    lines.push(`DTEND:${formatIcsDate(endTime)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    
    let desc = `${event.description || ''}\n\n`;
    if (event.ticketPrice > 0) {
      desc += `Ticket Price: £${event.ticketPrice}\n`;
    }
    desc += `Organised by ${communityName}\n`;
    desc += `Event Details & RSVP: ${eventUrl}`;
    
    lines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    lines.push(`URL:${eventUrl}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const icsBody = lines.join('\r\n');

  return new Response(icsBody, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${communityId}.ics"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
