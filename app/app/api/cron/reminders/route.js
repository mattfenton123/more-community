import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseEventDateTime } from '../../../../src/lib/calendar';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is configured, enforce security
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(req.url);
      if (url.searchParams.get('key') !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = Date.now();
    const twentyFourHoursFromNow = now + 24 * 60 * 60 * 1000;
    const twoHoursFromNow = now + 2 * 60 * 60 * 1000;

    // Fetch active upcoming events
    const { data: events, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .neq('status', 'cancelled');

    if (eventErr) throw eventErr;

    let notificationsCreated = 0;
    const eventReports = [];

    for (const event of events || []) {
      const dt = parseEventDateTime(event.date, event.time);
      if (!dt) continue;

      const eventTime = dt.getTime();
      const diffHours = (eventTime - now) / (1000 * 60 * 60);

      // Determine reminder tier (24h or 2h)
      let reminderType = null;
      let reminderTitle = '';
      let reminderMessage = '';

      if (diffHours > 0 && diffHours <= 2.5) {
        reminderType = 'reminder_2h';
        reminderTitle = `⏳ Starting Soon: ${event.title}`;
        reminderMessage = `${event.title} begins in less than 2 hours! Head to ${event.location || 'the meeting point'}. Looking forward to seeing you.`;
      } else if (diffHours > 2.5 && diffHours <= 26) {
        reminderType = 'reminder_24h';
        reminderTitle = `⏰ Tomorrow: ${event.title}`;
        reminderMessage = `Reminder: ${event.title} is taking place tomorrow at ${event.time || '10:00'}${event.location ? ' at ' + event.location : ''}. Check your digital pass in the app!`;
      }

      if (!reminderType) continue;

      // Find attendees with confirmed RSVPs
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('user_id, status')
        .eq('event_id', event.id);

      const attendees = (rsvps || []).filter(r => r.status === 'going' || r.status === 'checked_in' || !r.status);
      if (attendees.length === 0) continue;

      for (const attendee of attendees) {
        // Prevent duplicate reminders for the same tier
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', attendee.user_id)
          .eq('link', `/events/${event.id}`)
          .ilike('title', reminderType === 'reminder_2h' ? '%Starting Soon%' : '%Tomorrow%')
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Insert notification
        const { error: insertErr } = await supabase.from('notifications').insert({
          user_id: attendee.user_id,
          type: 'reminder',
          title: reminderTitle,
          message: reminderMessage,
          link: `/events/${event.id}`,
          is_read: false
        });

        if (!insertErr) {
          notificationsCreated++;
        }
      }

      eventReports.push({
        eventId: event.id,
        title: event.title,
        diffHours: Math.round(diffHours * 10) / 10,
        reminderType,
        attendeeCount: attendees.length
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      notificationsCreated,
      eventsProcessed: eventReports.length,
      reports: eventReports
    });
  } catch (error) {
    console.error('Cron reminders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
