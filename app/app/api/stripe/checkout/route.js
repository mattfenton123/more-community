import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const isLiveStripe = Boolean(
  stripeKey &&
  !stripeKey.includes('mock') &&
  !stripeKey.includes('placeholder')
);

const stripe = new Stripe(stripeKey || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const {
      type = 'event',
      eventId,
      userId,
      price: clientPrice,
      title: clientTitle,
      communityId,
      leaderStripeAccountId,
      referredBy
    } = await req.json();

    if (!userId || (type === 'event' && !eventId) || (type === 'subscription' && !communityId)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
    let verifiedPrice = Number(clientPrice || 0);
    let verifiedTitle = clientTitle || (type === 'subscription' ? 'Community Membership' : 'Event Ticket');

    if (type === 'subscription') {
      const { data: commData } = await supabase
        .from('communities')
        .select('name, subscription_price')
        .eq('id', communityId)
        .maybeSingle();

      if (commData) {
        if (commData.subscription_price != null && Number(commData.subscription_price) > 0) {
          verifiedPrice = Number(commData.subscription_price);
        }
        if (commData.name) verifiedTitle = `${commData.name} Membership`;
      }
    } else {
      const { data: eventData } = await supabase
        .from('events')
        .select('title, ticket_price')
        .eq('id', eventId)
        .maybeSingle();

      if (eventData) {
        if (eventData.ticket_price != null && Number(eventData.ticket_price) > 0) {
          verifiedPrice = Number(eventData.ticket_price);
        }
        if (eventData.title) verifiedTitle = eventData.title;
      }
    }

    if (!verifiedPrice || Number(verifiedPrice) <= 0) {
      return NextResponse.json({ error: 'Invalid or missing price' }, { status: 400 });
    }

    // Graceful simulated mode when live Stripe keys are not yet configured
    if (!isLiveStripe) {
      return NextResponse.json({
        simulated: true,
        sessionId: `sim_${Date.now()}`,
        url: null,
        verifiedPrice,
        verifiedTitle
      });
    }

    const isSubscription = type === 'subscription';
    const hasConnectedLeader = Boolean(
      leaderStripeAccountId &&
      !leaderStripeAccountId.startsWith('acct_express_demo')
    );

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: isSubscription ? verifiedTitle : `Ticket for ${verifiedTitle}`,
              description: isSubscription ? 'Monthly community membership' : 'Community event ticket',
            },
            unit_amount: Math.round(Number(verifiedPrice) * 100), // convert to pence
            ...(isSubscription ? { recurring: { interval: 'month' } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: isSubscription
        ? `${baseUrl}/community/${communityId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`
        : `${baseUrl}/events/${eventId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: isSubscription
        ? `${baseUrl}/community/${communityId}?checkout=cancelled`
        : `${baseUrl}/events/${eventId}?checkout=cancelled`,
      client_reference_id: `${userId}_${isSubscription ? communityId : eventId}`,
      metadata: {
        type,
        eventId: eventId || '',
        userId,
        communityId: communityId || '',
        referredBy: referredBy || ''
      },
    };

    if (hasConnectedLeader) {
      if (isSubscription) {
        sessionConfig.subscription_data = {
          application_fee_percent: 5,
          transfer_data: { destination: leaderStripeAccountId },
        };
      } else {
        sessionConfig.payment_intent_data = {
          application_fee_amount: Math.round(Number(verifiedPrice) * 100 * 0.05), // 5% platform fee
          transfer_data: { destination: leaderStripeAccountId },
        };
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ sessionId: session.id, url: session.url, simulated: false });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
