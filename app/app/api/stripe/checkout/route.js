import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

export async function POST(req) {
  try {
    const { eventId, userId, price, title, communityId, leaderStripeAccountId } = await req.json();

    if (!eventId || !userId || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real implementation, you would lookup the leader's Stripe Account ID from the database
    // to route funds via Stripe Connect (destination charges).
    
    // For this prototype, we mock the session creation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Ticket for ${title}`,
              description: `Community event ticket`,
            },
            unit_amount: Math.round(price * 100), // convert to pence
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
