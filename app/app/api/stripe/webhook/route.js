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
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
      } else if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET in production' }, { status: 400 });
      } else {
        event = JSON.parse(body);
      }
    } catch (err) {
      console.error(`Webhook Signature Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // 1. Checkout Session Completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { type, eventId, userId, communityId, referredBy } = session.metadata || {};

      if (type === 'leader_pro' && communityId) {
        const policyNo = `MC-PLI-2026-${communityId.slice(0, 6).toUpperCase()}`;
        const { error } = await supabaseAdmin.from('communities').update({
          is_insured: true,
          insurance_tier: 'pro',
          insurance_policy_number: policyNo,
          insurance_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }).eq('id', communityId);

        if (error) console.error('Failed to update community leader pro status:', error);
        console.log(`Leader Pro activated for community ${communityId}`);
      } else if (type === 'subscription' && communityId && userId) {
        const { error } = await supabaseAdmin.from('community_memberships').upsert([{
          community_id: communityId,
          user_id: userId,
          role: 'Member'
        }], { onConflict: 'community_id,user_id' });

        if (error) console.error('Failed to update community_memberships:', error);
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
        if (error) console.error('Failed to update event_rsvps:', error);
        console.log(`Payment successful for user ${userId} to event ${eventId}`);
      }
    }

    // 2. Subscription Cancelled / Ended
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const { type, communityId, userId } = subscription.metadata || {};
      
      if (type === 'leader_pro' && communityId) {
        await supabaseAdmin.from('communities').update({
          is_insured: false,
          insurance_tier: 'free'
        }).eq('id', communityId);
        console.log(`Leader Pro ended for community ${communityId}`);
      }
    }

    // 3. Connect Account Updated
    if (event.type === 'account.updated') {
      const account = event.data.object;
      const communityId = account.metadata?.communityId;
      if (communityId && account.details_submitted) {
        await supabaseAdmin.from('communities').update({
          stripe_account_id: account.id
        }).eq('id', communityId);
        console.log(`Stripe Connect verified for community ${communityId}: ${account.id}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
