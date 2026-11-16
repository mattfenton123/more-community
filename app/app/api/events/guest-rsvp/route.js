import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTicketConfirmationEmail } from '../../../../src/lib/emailService';
import { formatShareLocation } from '../../../../src/lib/location';
import { getDefaultAvatar } from '../../../../src/lib/avatar';

function isValidServiceRoleKey(key, url) {
  if (!key) return false;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (payload.ref) {
      const urlHost = new URL(url).hostname;
      if (!urlHost.includes(payload.ref)) return false;
    }
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

function getDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';
  const rawService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = isValidServiceRoleKey(rawService, url) ? rawService : anonKey;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { eventId, name, email, guestName, guestEmail, answer } = body || {};

    if (!eventId || !name || !email) {
      return NextResponse.json({ error: 'Event, name, and email are required.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid name and email address.' }, { status: 400 });
    }

    const db = getDbClient();

    // 1. Fetch Event details
    const { data: event, error: eventErr } = await db
      .from('events')
      .select('*, communities(name, image)')
      .eq('id', eventId)
      .maybeSingle();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    // 2. Create guest profile in public.users
    const guestId = `guest_${crypto.randomUUID()}`;
    const bioString = `[Email: ${cleanEmail}] [Source: guest_rsvp] [Event: ${eventId}]${answer ? ` [Answer: ${String(answer).trim()}]` : ''}`;

    const userPayload = {
      id: guestId,
      name: cleanName,
      role: 'Guest',
      bio: bioString,
      joined: `Joined ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
      avatar: getDefaultAvatar(cleanName),
      interests: [`email:${cleanEmail}`, 'guest', 'opt_in:true'],
      onboarded: true,
      location: formatShareLocation(event.location, '').split(',')[0].trim()
    };

    const { error: userErr } = await db.from('users').insert(userPayload);
    if (userErr) {
      console.error('[GuestRSVP] Error creating user record:', userErr.message);
    }

    // 3. Insert RSVP into public.event_rsvps (with column fallback if older schema lacks metadata cols)
    const rsvpPayload = {
      event_id: eventId,
      user_id: guestId,
      status: 'going',
      ticket_type: 'free',
      ...(guestName ? { guest_name: String(guestName).trim() } : {}),
      ...(answer ? { answer: String(answer).trim() } : {}),
    };

    let { error: rsvpErr } = await db.from('event_rsvps').insert(rsvpPayload);
    if (rsvpErr && (rsvpErr.code === '42703' || rsvpErr.code === 'PGRST204' || rsvpErr.message?.includes('column'))) {
      const retry = await db.from('event_rsvps').insert({
        event_id: eventId,
        user_id: guestId,
        status: 'going',
      });
      rsvpErr = retry.error;
    }
    if (rsvpErr) {
      console.error('[GuestRSVP] Error creating RSVP record:', rsvpErr.message);
    }

    // 4. Handle +1 Guest if provided
    let plusOneData = null;
    if (guestName || guestEmail) {
      plusOneData = {
        name: guestName ? String(guestName).trim() : 'Guest',
        email: guestEmail ? String(guestEmail).trim().toLowerCase() : ''
      };

      if (plusOneData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(plusOneData.email)) {
        const plusOneId = `guest_${crypto.randomUUID()}`;
        await db.from('users').insert({
          id: plusOneId,
          name: plusOneData.name,
          role: 'Guest',
          bio: `[Email: ${plusOneData.email}] [Source: plus_one_guest] [InvitedBy: ${cleanEmail}] [Event: ${eventId}]`,
          joined: `Joined ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
          avatar: getDefaultAvatar(plusOneData.name),
          interests: [`email:${plusOneData.email}`, 'plus_one', 'opt_in:true']
        });

        try {
          await sendTicketConfirmationEmail({
            to: plusOneData.email,
            name: plusOneData.name,
            event,
            community: event.communities,
            isGuest: true
          });
        } catch (emailErr) {
          console.error('[GuestRSVP] +1 confirmation email error:', emailErr?.message || emailErr);
        }
      }
    }

    // 5. Send Email Ticket to Main Attendee (non-blocking if mail service unavailable)
    try {
      await sendTicketConfirmationEmail({
        to: cleanEmail,
        name: cleanName,
        event,
        community: event.communities,
        isGuest: true,
        plusOne: plusOneData
      });
    } catch (emailErr) {
      console.error('[GuestRSVP] Confirmation email error:', emailErr?.message || emailErr);
    }

    const ticketNumber = `TKT-${guestId.slice(-6).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      guestId,
      ticketNumber,
      attendeeName: cleanName,
      attendeeEmail: cleanEmail,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: formatShareLocation(event.location, '')
      }
    });

  } catch (err) {
    console.error('[GuestRSVP] Server error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
