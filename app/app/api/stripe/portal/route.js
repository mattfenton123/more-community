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
    const rateCheck = checkRateLimit(`portal_${ip}`, 15, 60000);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    // 2. User authentication verification
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let authUser = null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        authUser = data.user;
      }
    }

    const { customerId: incomingCustomerId, returnUrl: clientReturnUrl } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
    const returnUrl = clientReturnUrl || `${baseUrl}/dashboard?tab=monetisation`;

    if (!isLiveStripe) {
      return NextResponse.json({
        url: returnUrl,
        simulated: true,
        message: 'Customer portal simulated mode'
      });
    }

    // 3. Resolve customer ID securely server-side
    let targetCustomerId = null;

    if (authUser?.email) {
      const customers = await stripe.customers.list({
        email: authUser.email,
        limit: 1
      });
      if (customers.data && customers.data.length > 0) {
        targetCustomerId = customers.data[0].id;
      }
    }

    // Fallback only if verified customer matches
    if (!targetCustomerId && incomingCustomerId) {
      try {
        const retrieved = await stripe.customers.retrieve(incomingCustomerId);
        if (retrieved && !retrieved.deleted && (!authUser?.email || retrieved.email === authUser.email)) {
          targetCustomerId = retrieved.id;
        }
      } catch (e) {
        // Not a valid or accessible customer
      }
    }

    if (!targetCustomerId) {
      return NextResponse.json({ error: 'No active Stripe billing customer found for your account' }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: targetCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url, simulated: false });
  } catch (error) {
    console.error('Customer Portal error:', error);
    return NextResponse.json({ error: error.message || 'Could not open billing portal' }, { status: 500 });
  }
}
