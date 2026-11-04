import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const isLiveStripe = Boolean(
  stripeKey &&
  !stripeKey.includes('mock') &&
  !stripeKey.includes('placeholder')
);

const stripe = new Stripe(stripeKey || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

export async function POST(req) {
  try {
    const { customerId, returnUrl: clientReturnUrl } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
    const returnUrl = clientReturnUrl || `${baseUrl}/dashboard?tab=monetisation`;

    if (!isLiveStripe) {
      return NextResponse.json({
        url: returnUrl,
        simulated: true,
        message: 'Customer portal simulated mode'
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url, simulated: false });
  } catch (error) {
    console.error('Customer Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
