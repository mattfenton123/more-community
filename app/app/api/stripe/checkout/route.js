import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const { eventId, userId, price: clientPrice, title: clientTitle, communityId, leaderStripeAccountId } = await req.json();

    if (!eventId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify price from database to prevent client-side price tampering
    let verifiedPrice = clientPrice;
    let verifiedTitle = clientTitle || 'Event Ticket';

    const { data: eventData } = await supabase
      .from('events')
      .select('title, ticket_price, price')
      .eq('id', eventId)
      .single();

    if (eventData) {
      if (eventData.ticket_price != null && Number(eventData.ticket_price) > 0) {
        verifiedPrice = Number(eventData.ticket_price);
      } else if (eventData.price != null && Number(eventData.price) > 0) {
        verifiedPrice = Number(eventData.price);
      }
      if (eventData.title) verifiedTitle = eventData.title;
    }

    if (!verifiedPrice || Number(verifiedPrice) <= 0) {
      return NextResponse.json({ error: 'Invalid or missing ticket price' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Ticket for ${verifiedTitle}`,
              description: `Community event ticket`,
            },
            unit_amount: Math.round(Number(verifiedPrice) * 100), // convert to pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/community/${communityId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/community/${communityId}?checkout=cancelled`,
      client_reference_id: `${userId}_${eventId}`, // Pass our internal IDs so webhook can fulfill it
      metadata: {
        eventId,
        userId,
        communityId
      },
      // payment_intent_data: {
      //   application_fee_amount: Math.round(price * 100 * 0.05), // 5% platform fee
      //   transfer_data: {
      //     destination: leaderStripeAccountId,
      //   },
      // },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
