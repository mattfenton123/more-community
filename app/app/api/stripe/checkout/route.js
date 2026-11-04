import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../../../../src/lib/rateLimit';

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
    // 1. Rate limiting guard
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'anon';
    const rateCheck = checkRateLimit(`checkout_${ip}`, 25, 60000);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many checkout requests. Please wait a moment.' }, { status: 429 });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let authUser = null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        authUser = data.user;
      }
    }

    const {
      type = 'event',
      eventId,
      userId: incomingUserId,
      communityId: incomingCommunityId,
      interval = 'annual',
      referredBy
    } = await req.json();

    // Authenticated user ID takes precedence over body
    const userId = authUser?.id || incomingUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((type === 'event' && !eventId) || ((type === 'subscription' || type === 'leader_pro') && !incomingCommunityId)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
    let verifiedPrice = 0;
    let verifiedTitle = '';
    let communityId = incomingCommunityId || '';
    let leaderStripeAccountId = null;
    let isSubscription = false;
    let recurringInterval = 'month';
    let feePercent = 5; // Default 5% standard platform fee

    // 2. Fetch and strictly verify price from database
    if (type === 'leader_pro') {
      const { data: commData, error: commErr } = await supabase
        .from('communities')
        .select('id, name, created_by, leader_id')
        .eq('id', communityId)
        .maybeSingle();

      if (commErr || !commData) {
        return NextResponse.json({ error: 'Community not found' }, { status: 404 });
      }

      // Verify leader authorization if session is authenticated
      if (authUser && commData.created_by && authUser.id !== commData.created_by && authUser.id !== commData.leader_id) {
        return NextResponse.json({ error: 'Only community leaders can activate Leader Pro' }, { status: 403 });
      }

      const isAnnual = interval === 'annual';
      verifiedPrice = isAnnual ? 165.00 : 16.50;
      verifiedTitle = `MORE Leader Pro (${isAnnual ? 'Annual' : 'Monthly'})`;
      recurringInterval = isAnnual ? 'year' : 'month';
      isSubscription = true;
      leaderStripeAccountId = null; // Direct to platform
      feePercent = 0;
    } else if (type === 'subscription') {
      const { data: commData, error: commErr } = await supabase
        .from('communities')
        .select('id, name, subscription_price, stripe_account_id, is_insured, insurance_tier')
        .eq('id', communityId)
        .maybeSingle();

      if (commErr || !commData) {
        return NextResponse.json({ error: 'Community not found' }, { status: 404 });
      }

      verifiedPrice = Number(commData.subscription_price || 0);
      if (verifiedPrice <= 0) {
        return NextResponse.json({ error: 'Community does not offer a paid membership tier' }, { status: 400 });
      }

      verifiedTitle = `${commData.name} Membership`;
      isSubscription = true;
      recurringInterval = 'month';

      // Look up leader connected account strictly from database
      if (commData.stripe_account_id && !commData.stripe_account_id.startsWith('acct_express_demo')) {
        leaderStripeAccountId = commData.stripe_account_id;
      }

      // Pro leaders get 0% platform fee, standard leaders pay 5%
      const isProLeader = Boolean(commData.is_insured || commData.insurance_tier === 'pro');
      feePercent = isProLeader ? 0 : 5;
    } else {
      // Event Ticket
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('id, title, ticket_price, community_id')
        .eq('id', eventId)
        .maybeSingle();

      if (eventErr || !eventData) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      verifiedPrice = Number(eventData.ticket_price || 0);
      if (verifiedPrice <= 0) {
        return NextResponse.json({ error: 'Event does not require paid tickets' }, { status: 400 });
      }

      verifiedTitle = eventData.title;
      communityId = eventData.community_id;
      isSubscription = false;

      // Look up community leader's Stripe Connect account & Pro status from database
      if (communityId) {
        const { data: commData } = await supabase
          .from('communities')
          .select('stripe_account_id, is_insured, insurance_tier')
          .eq('id', communityId)
          .maybeSingle();

        if (commData) {
          if (commData.stripe_account_id && !commData.stripe_account_id.startsWith('acct_express_demo')) {
            leaderStripeAccountId = commData.stripe_account_id;
          }
          const isProLeader = Boolean(commData.is_insured || commData.insurance_tier === 'pro');
          feePercent = isProLeader ? 0 : 5;
        }
      }
    }

    if (!isLiveStripe) {
      return NextResponse.json({
        simulated: true,
        sessionId: `sim_${Date.now()}`,
        url: null,
        verifiedPrice,
        verifiedTitle
      });
    }

    const unitAmountPence = Math.round(verifiedPrice * 100);
    const hasConnectedLeader = Boolean(leaderStripeAccountId);

    const getSuccessUrl = () => {
      if (type === 'leader_pro') {
        return `${baseUrl}/dashboard?community=${communityId}&tab=overview&shield=success&session_id={CHECKOUT_SESSION_ID}`;
      }
      if (type === 'subscription') {
        return `${baseUrl}/community/${communityId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
      }
      return `${baseUrl}/events/${eventId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    };

    const getCancelUrl = () => {
      if (type === 'leader_pro') {
        return `${baseUrl}/dashboard?community=${communityId}&tab=overview&shield=cancelled`;
      }
      if (type === 'subscription') {
        return `${baseUrl}/community/${communityId}?checkout=cancelled`;
      }
      return `${baseUrl}/events/${eventId}?checkout=cancelled`;
    };

    const sessionMetadata = {
      type,
      eventId: eventId || '',
      userId,
      communityId: communityId || '',
      referredBy: referredBy || ''
    };

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: isSubscription ? verifiedTitle : `Ticket: ${verifiedTitle}`,
              description: type === 'leader_pro'
                ? 'Venue RAMS Generator, Attendee Waivers, Verified Trust Badge & 0% Platform Ticket Fees'
                : (isSubscription ? 'Monthly community membership' : 'Community event ticket'),
            },
            unit_amount: unitAmountPence,
            ...(isSubscription ? { recurring: { interval: recurringInterval } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      ...(!isSubscription ? { invoice_creation: { enabled: true } } : {}),
      success_url: getSuccessUrl(),
      cancel_url: getCancelUrl(),
      client_reference_id: `${userId}_${communityId || eventId}`,
      metadata: sessionMetadata,
    };

    if (isSubscription) {
      sessionConfig.subscription_data = {
        metadata: sessionMetadata,
        ...(hasConnectedLeader ? {
          application_fee_percent: feePercent,
          transfer_data: { destination: leaderStripeAccountId },
          on_behalf_of: leaderStripeAccountId,
        } : {})
      };
    } else if (hasConnectedLeader) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: feePercent > 0 ? Math.round(unitAmountPence * (feePercent / 100)) : 0,
        transfer_data: { destination: leaderStripeAccountId },
        on_behalf_of: leaderStripeAccountId,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ sessionId: session.id, url: session.url, simulated: false });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 });
  }
}
