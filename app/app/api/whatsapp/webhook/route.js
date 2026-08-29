import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Lazy-initialize the Supabase client to avoid build-time crashes
let _supabaseAdmin;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    _supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return _supabaseAdmin;
}

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'more_community_secret_token';

// Handle webhook verification (GET request)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp Webhook verified!');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// Handle incoming messages (POST request)
export async function POST(request) {
  try {
    const body = await request.json();

    // Check if it's a WhatsApp message event
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            for (const message of change.value.messages) {
              await processMessage(message, change.value.metadata);
            }
          }
        }
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (err) {
    console.error('Webhook error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function processMessage(message, metadata) {
  const supabase = getSupabaseAdmin();
  const senderNumber = message.from;
  const messageText = message.text?.body || '[Unsupported message type]';
  
  // In a real app, we would look up the user by their phone number (senderNumber)
  // For the MVP, we create a ghost user or fallback
  const ghostUserId = `wa_${senderNumber}`;
  
  // We need to route this to a specific community and channel
  // Normally, we'd map the WhatsApp Group ID to a Community ID.
  // Since we don't have this fully wired in the DB, we'll route to a demo community (e.g. 'yentw')
  // We can use the group ID from the message context if it's sent in a group
  const communityId = 'yentw';
  const channelId = 'general';
  
  // Ensure the ghost user exists in the DB so foreign keys don't fail
  const { data: existingUser } = await supabase.from('users').select('id').eq('id', ghostUserId).single();
  
  if (!existingUser) {
    await supabase.from('users').insert({
      id: ghostUserId,
      name: `WhatsApp User (${senderNumber.slice(-4)})`,
      role: 'Member',
      bio: 'Joined via WhatsApp'
    });
  }

  // Insert the message into Supabase
  // Because Realtime is enabled on the messages table, this instantly syncs to the frontend UI
  await supabase.from('messages').insert({
    community_id: communityId,
    channel_id: channelId,
    author_id: ghostUserId,
    text: messageText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  
  console.log(`Successfully synced WhatsApp message from ${senderNumber} to community ${communityId}`);
}
