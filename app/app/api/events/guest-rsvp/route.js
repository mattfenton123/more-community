import { NextResponse } from 'next/navigation';
import { supabase } from '../../../../src/lib/supabaseClient';
import { sendTicketConfirmationEmail } from '../../../../src/lib/emailService';
import { formatShareLocation } from '../../../../src/lib/location';

export async function POST(request) {
  try {
    const body = await request.json();
    const { eventId, name, email, guestName, guestEmail, answer } = body;

    if (!eventId || !name || !email) {
      return NextResponse.json({ error: 'Event, name, and email are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // 1. Fetch Event details
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('*, communities(name, image)')
      .eq('id', eventId)
      .maybeSingle();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    // 2. Create or find guest in public.users
    const guestId = `guest_${crypto.randomUUID()}`;
    const bioString = `[Email: ${cleanEmail}] [Source: guest_rsvp] [Event: ${eventId}]${answer ? ` [Answer: ${answer.trim()}]` : ''}`;
    
    const userPayload = {
      id: guestId,
      name: cleanName,
      role: 'Guest',
      bio: bioString,
      joined: `Joined ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&background=0d9488&color=fff`,
      interests: [`email:${cleanEmail}`, 'guest', 'opt_in:true'],
      onboarded: true,
      location: formatShareLocation(event.location, '').split(',')[0].trim()
    };

    const { error: userErr } = await supabase.from('users').insert(userPayload);
    if (userErr) {
      console.error('[GuestRSVP] Error creating user record:', userErr);
    }

    // 3. Insert RSVP into public.event_rsvps
    const rsvpPayload = {
      event_id: eventId,
      user_id: guestId,
      status: 'going',
      ticket_type: 'free'
    };

    const { error: rsvpErr } = await supabase.from('event_rsvps').insert(rsvpPayload);
    if (rsvpErr) {
      console.error('[GuestRSVP] Error creating RSVP record:', rsvpErr);
    }

    // 4. Handle +1 Guest if provided
    let plusOneData = null;
    if (guestName || guestEmail) {
      plusOneData = {
        name: guestName ? guestName.trim() : 'Guest',
        email: guestEmail ? guestEmail.trim().toLowerCase() : ''
      };

      if (plusOneData.email) {
        // Also capture the +1 guest email in users
        const plusOneId = `guest_${crypto.randomUUID()}`;
        await supabase.from('users').insert({
          id: plusOneId,
          name: plusOneData.name,
          role: 'Guest',
          bio: `[Email: ${plusOneData.email}] [Source: plus_one_guest] [InvitedBy: ${cleanEmail}] [Event: ${eventId}]`,
          joined: `Joined ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(plusOneData.name)}&background=14b8a6&color=fff`,
          interests: [`email:${plusOneData.email}`, 'plus_one', 'opt_in:true']
        });

        // Send confirmation to the +1 too
        await sendTicketConfirmationEmail({
          to: plusOneData.email,
          name: plusOneData.name,
          event,
          community: event.communities,
          isGuest: true
        });
      }
    }

    // 5. Send Email Ticket to Main Attendee
    await sendTicketConfirmationEmail({
      to: cleanEmail,
      name: cleanName,
      event,
      community: event.communities,
      isGuest: true,
      plusOne: plusOneData
    });

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
