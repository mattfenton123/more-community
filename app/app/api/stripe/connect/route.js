import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../../../../src/lib/rateLimit';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const isLiveStripe = stripeKey && !stripeKey.includes('mock') && !stripeKey.includes('placeholder');
const stripe = isLiveStripe ? new Stripe(stripeKey, { apiVersion: '2023-10-16' }) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'anon';
    const rateCheck = checkRateLimit(`connect_${ip}`, 20, 60000);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
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

    const { communityId, returnUrl: clientReturnUrl } = await req.json();

    if (!communityId) {
      return NextResponse.json({ error: 'Missing communityId' }, { status: 400 });
    }

    // 1. Verify community exists and leader permissions
    const { data: comm, error: commErr } = await supabase
      .from('communities')
      .select('id, name, leader_id, created_by, stripe_account_id')
      .eq('id', communityId)
      .maybeSingle();

    if (commErr || !comm) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (authUser && comm.created_by && authUser.id !== comm.created_by && authUser.id !== comm.leader_id) {
      return NextResponse.json({ error: 'Unauthorized: Only the community leader can connect payouts' }, { status: 403 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
    const returnUrl = clientReturnUrl || `${baseUrl}/dashboard?tab=monetisation&stripe_connect=success`;
    const refreshUrl = `${baseUrl}/dashboard?tab=monetisation&stripe_connect=refresh`;

    if (!isLiveStripe || !stripe) {
      const simulatedUrl = `${returnUrl}&account_id=acct_express_demo_${communityId}`;
      return NextResponse.json({
        url: simulatedUrl,
        accountId: `acct_express_demo_${communityId}`,
        simulated: true,
        message: 'Stripe simulated mode active. Connecting leader account.'
      });
    }

    let targetAccountId = null;

    // 2. Reuse verified Stripe account if already stored for this community
    if (comm.stripe_account_id && !comm.stripe_account_id.startsWith('acct_express_demo')) {
      try {
        const existing = await stripe.accounts.retrieve(comm.stripe_account_id);
        if (existing && !existing.deleted) {
          targetAccountId = existing.id;
        }
      } catch (retErr) {
        console.warn('Previously stored stripe_account_id not found in Stripe:', comm.stripe_account_id);
      }
    }

    // 3. Create a new Standard Stripe account for the leader if none exists
    if (!targetAccountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        country: 'GB',
        metadata: {
          communityId: comm.id,
          leaderId: authUser?.id || comm.created_by || 'leader',
          communityName: comm.name || 'Community',
          platform: 'morecommunity.app'
        },
      });
      targetAccountId = account.id;

      // Persist the new account ID to the community
      await supabase
        .from('communities')
        .update({ stripe_account_id: targetAccountId })
        .eq('id', comm.id);
    }

    // 4. Generate the hosted onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: targetAccountId,
      refresh_url: refreshUrl,
      return_url: `${returnUrl}&account_id=${targetAccountId}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: targetAccountId,
      simulated: false,
    });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start Stripe Connect onboarding' }, { status: 500 });
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
      email: account.email,
    });
  } catch (error) {
    console.error('Stripe Connect status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
