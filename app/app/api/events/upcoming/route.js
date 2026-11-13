import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabaseClient';
import { isEventUpcoming } from '../../../../src/lib/calendar';
import { cleanLocationName } from '../../../../src/lib/location';
import { getEventPath } from '../../../../src/lib/eventLinks';

export const dynamic = 'force-dynamic';

function inferCategory(event) {
  const cat = event?.communities?.category;
  if (cat) return cat;
  const text = `${event?.title || ''} ${event?.communities?.name || ''}`.toLowerCase();
  if (/breath|cold|sauna|yoga|wellness|mind|mental|mankind/.test(text)) return 'Wellness & Support';
  if (/walk|hike|ridge|downs|castle|trail/.test(text)) return 'Walking & Outdoors';
  if (/run|5k|parkrun|jog/.test(text)) return 'Run Club';
  if (/founder|entrepreneur|yentw|business|coffee/.test(text)) return 'Founders & Social';
  return 'Community Gathering';
}

function summarizeDesc(raw) {
  const clean = String(raw || '').replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 130) return clean;
  return clean.slice(0, 127).trimEnd() + '...';
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(12, Math.max(1, Number(searchParams.get('limit')) || 3));
    const todayIso = new Date().toISOString().split('T')[0];

    const { data: rows, error } = await supabase
      .from('events')
      .select('id, community_id, title, description, date, time, location, image, status, max_capacity, ticket_price, cohost_community_ids, communities(id, name, image, category, verified)')
      .eq('status', 'published')
      .gte('date', todayIso)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(50);

    if (error) {
      return NextResponse.json({ events: [], error: error.message }, { status: 200 });
    }

    const upcoming = (rows || []).filter((e) => isEventUpcoming(e));

    // Showcase diverse real communities first while preserving chronological order
    const picked = [];
    const seenComms = new Set();
    for (const ev of upcoming) {
      if (picked.length >= limit) break;
      const cid = ev.community_id || ev.id;
      if (!seenComms.has(cid)) {
        picked.push(ev);
        seenComms.add(cid);
      }
    }
    if (picked.length < limit) {
      const pickedIds = new Set(picked.map((p) => p.id));
      for (const ev of upcoming) {
        if (picked.length >= limit) break;
        if (!pickedIds.has(ev.id)) {
          picked.push(ev);
          pickedIds.add(ev.id);
        }
      }
    }

    let rsvpCounts = {};
    const ids = picked.map((e) => e.id).filter(Boolean);
    if (ids.length > 0) {
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('event_id, status')
        .in('event_id', ids);
      if (Array.isArray(rsvps)) {
        for (const r of rsvps) {
          if (!r.status || r.status === 'going') {
            rsvpCounts[r.event_id] = (rsvpCounts[r.event_id] || 0) + 1;
          }
        }
      }
    }

    const { count: communityCount } = await supabase
      .from('communities')
      .select('id', { count: 'exact', head: true });

    const serialized = picked.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time || '',
      location: cleanLocationName(e.location) || 'Local Venue',
      summary: summarizeDesc(e.description),
      image: e.image || e.communities?.image || '/images/hero.png',
      communityId: e.community_id,
      communityName: e.communities?.name || 'Local Community',
      communityVerified: Boolean(e.communities?.verified),
      category: inferCategory(e),
      ticketPrice: Number(e.ticket_price) || 0,
      maxCapacity: e.max_capacity ? Number(e.max_capacity) : null,
      attendeesCount: rsvpCounts[e.id] || 0,
      allowCarpool: !String(e.description || '').includes('[Carpool: disabled]'),
      url: getEventPath(e),
    }));

    return NextResponse.json(
      {
        events: serialized,
        totalUpcoming: upcoming.length,
        totalCommunities: communityCount || null,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { events: [], error: err?.message || 'Failed to load events' },
      { status: 200 }
    );
  }
}
