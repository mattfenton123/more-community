import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(req) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
      } else {
        event = JSON.parse(body);
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { type, eventId, userId, communityId, referredBy } = session.metadata || {};

      if (type === 'subscription' && communityId && userId) {
        const { error } = await supabaseAdmin.from('community_memberships').upsert([{
          community_id: communityId,
          user_id: userId,
          role: 'Member'
        }], { onConflict: 'community_id,user_id' });

        if (error) {
          console.error('Failed to update community_memberships:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        console.log(`Subscription active for user ${userId} in community ${communityId}`);
      } else if (eventId && userId) {
        const rsvpPayload = {
          event_id: eventId,
          user_id: userId,
          status: 'going',
          ticket_type: 'paid',
          payment_status: 'paid',
          stripe_session_id: session.id
        };
        if (referredBy) rsvpPayload.referred_by = referredBy;

        const { error } = await supabaseAdmin.from('event_rsvps').upsert([rsvpPayload], { onConflict: 'event_id,user_id' });

        if (error) {
          console.error('Failed to update event_rsvps:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        console.log(`Payment successful for user ${userId} to event ${eventId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
