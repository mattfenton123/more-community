import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const isLiveStripe = stripeKey && !stripeKey.includes('mock') && !stripeKey.includes('placeholder');
const stripe = isLiveStripe ? new Stripe(stripeKey, { apiVersion: '2023-10-16' }) : null;

export async function POST(req) {
  try {
    const { communityId, returnUrl: clientReturnUrl } = await req.json();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
    const returnUrl = clientReturnUrl || `${baseUrl}/dashboard?tab=monetisation&stripe_connect=success`;
    const refreshUrl = `${baseUrl}/dashboard?tab=monetisation&stripe_connect=refresh`;

    if (!isLiveStripe || !stripe) {
      // In demo or test mode without production Stripe keys, provide a simulated onboarding redirect
      const simulatedUrl = `${returnUrl}&account_id=acct_express_demo_${communityId || 'leader'}`;
      return NextResponse.json({
        url: simulatedUrl,
        accountId: `acct_express_demo_${communityId || 'leader'}`,
        simulated: true,
        message: 'Stripe simulated mode active. Connecting leader account.'
      });
    }

    // 1. Create a Stripe Express account for the leader
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'GB',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        communityId: communityId || 'unknown',
      },
    });

    // 2. Generate the onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: `${returnUrl}&account_id=${account.id}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
      simulated: false,
    });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
    }

    if (accountId.startsWith('acct_express_demo')) {
      return NextResponse.json({
        connected: true,
        payouts_enabled: true,
        charges_enabled: true,
        country: 'GB',
        currency: 'gbp',
        simulated: true,
      });
    }

    if (!stripe) {
      return NextResponse.json({
        connected: false,
        error: 'Stripe is not configured in this environment'
      });
    }

    const account = await stripe.accounts.retrieve(accountId);
    return NextResponse.json({
      connected: account.details_submitted,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
      country: account.country,
      currency: account.default_currency,
      simulated: false,
    });
  } catch (error) {
    console.error('Stripe retrieve error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
