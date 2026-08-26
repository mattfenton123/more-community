import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../../src/lib/supabaseClient'; // Adjusted path if needed

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

// Use edge runtime if standard node has issues, but standard is fine
// export const runtime = 'edge'; 

export async function POST(req) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    
    // Fallback secret for local testing if env is not set
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      // Return 400 if signature fails, but in dev/mock we might want to bypass
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
      } else {
        // Fallback for dev: just parse the body
        event = JSON.parse(body);
      }
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const { eventId, userId } = session.metadata;
      
      // Update our database to confirm the RSVP
      // Note: In production, you MUST use a secure Service Role key for this!
      // Here we assume supabaseClient has the necessary permissions.
      const { error } = await supabase.from('event_rsvps').upsert([{
        event_id: eventId,
        user_id: userId,
        status: 'going',
        ticket_type: 'paid',
        payment_status: 'paid',
        stripe_session_id: session.id
      }], { onConflict: 'event_id,user_id' });

      if (error) {
        console.error('Failed to update event_rsvps:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Payment successful for user ${userId} to event ${eventId}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
