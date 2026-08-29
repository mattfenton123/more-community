"use server";

import { createClient } from '@supabase/supabase-js';

// Instantiate Supabase client using Service Role Key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyUser(token, expectedUserId) {
  if (!token) throw new Error("Missing authentication token");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new Error("Invalid or expired token");
  if (expectedUserId && user.id !== expectedUserId) throw new Error("Unauthorized: User ID mismatch");
  return user;
}

export async function sendMessageAction(messageData, token) {
  if (!messageData.authorId) throw new Error("Unauthorized");
  await verifyUser(token, messageData.authorId);
  
  const { data, error } = await supabaseAdmin.from('messages').insert({
    community_id: messageData.communityId,
    channel_id: messageData.channel,
    author_id: messageData.authorId,
    text: messageData.text,
    image: messageData.image || null
  }).select().single();
  
  if (error) throw new Error(error.message);
  
  // --- WhatsApp Broadcast (Outbound Sync) ---
  try {
    // 1. Fetch community details to check for linked WhatsApp group
    // In a real app, you would query the `whatsapp_group_id` from the community settings
    // const { data: community } = await supabaseAdmin.from('communities').select('whatsapp_group_id').eq('id', messageData.communityId).single();
    
    // For MVP, simulate that 'yentw' community has a linked WhatsApp group
    if (messageData.communityId === 'yentw' && process.env.WHATSAPP_ACCESS_TOKEN) {
      const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
      const targetGroupId = 'MOCK_WHATSAPP_GROUP_ID'; // Replace with community.whatsapp_group_id

      // 2. Fetch the sender's name to attribute the message
      const { data: user } = await supabaseAdmin.from('users').select('name').eq('id', messageData.authorId).single();
      const senderName = user?.name || 'A member';
      
      const whatsappPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual", // Changed to individual for standard Cloud API compatibility in MVP, would be group with Twilio or specialized Meta access
        to: targetGroupId,
        type: "text",
        text: { 
          body: `*${senderName}* (via more. app):\n${messageData.text}` 
        }
      };

      // 3. Fire-and-forget the broadcast
      fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(whatsappPayload)
      }).catch(err => console.error('Failed to broadcast to WhatsApp:', err));
    }
  } catch (err) {
    console.error('Error in WhatsApp broadcast logic:', err);
  }

  return data;
}

export async function createCommunityAction(communityData, token) {
  if (!communityData.name) throw new Error("Missing community data");
  if (communityData.creatorId) await verifyUser(token, communityData.creatorId);

  const { data, error } = await supabaseAdmin.from('communities').insert({
    id: communityData.id,
    name: communityData.name,
    description: communityData.description,
    tags: communityData.tags,
    image: communityData.cover_image,
    lat: communityData.lat || null,
    lng: communityData.lng || null
  }).select().single();

  if (error) throw new Error(error.message);

  // Automatically make the creator a leader
  if (communityData.creatorId) {
    await supabaseAdmin.from('community_memberships').insert({
      community_id: data.id,
      user_id: communityData.creatorId,
      role: 'Leader'
    });
  }

  return data;
}

export async function joinCommunityAction(userId, communityId, token) {
  if (!userId || !communityId) throw new Error("Missing data");
  await verifyUser(token, userId);

  const { data, error } = await supabaseAdmin.from('community_memberships').insert({
    user_id: userId,
    community_id: communityId,
    role: 'Member'
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createEventAction(eventData, token) {
  // In a real app we'd verify the user is a leader of the community, but for demo:
  await verifyUser(token);

  const { data, error } = await supabaseAdmin.from('events').insert({
    ...(eventData.id && { id: eventData.id }),
    community_id: eventData.communityId,
    title: eventData.title,
    date: eventData.date,
    time: eventData.time,
    location: eventData.location,
    image: eventData.image,
    attendees: eventData.attendees || 0
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

export async function leaveCommunityAction(userId, communityId, token) {
  if (!userId || !communityId) throw new Error("Missing data");
  await verifyUser(token, userId);

  const { error } = await supabaseAdmin.from('community_memberships')
    .delete()
    .match({ user_id: userId, community_id: communityId });

  if (error) throw new Error(error.message);
  return true;
}

export async function rsvpToEventAction(userId, eventId, status, ticketType, token) {
  if (!userId || !eventId) throw new Error("Missing data");
  await verifyUser(token, userId);

  if (status === 'not_going') {
    const { error } = await supabaseAdmin.from('event_rsvps')
      .delete()
      .match({ user_id: userId, event_id: eventId });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin.from('event_rsvps').upsert([{
      user_id: userId,
      event_id: eventId,
      status: status,
      ticket_type: ticketType
    }], { onConflict: 'event_id,user_id' });
    if (error) throw new Error(error.message);
  }
  return true;
}

export async function uploadImageAction(formData, token) {
  await verifyUser(token);
  
  const file = formData.get('file');
  const userId = formData.get('userId');
  
  if (!file) throw new Error("No file provided");
  
  const filename = file.name || 'image.webp';
  const fileExt = filename.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const { data, error } = await supabaseAdmin.storage
    .from('uploads')
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw new Error(error.message);
  
  const { data: publicData } = supabaseAdmin.storage
    .from('uploads')
    .getPublicUrl(fileName);
    
  return publicData.publicUrl;
}

export async function updateEventAction(eventId, updates, token) {
  await verifyUser(token);
  
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.time !== undefined) dbUpdates.time = updates.time;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.maxCapacity !== undefined) dbUpdates.max_capacity = updates.maxCapacity;
  
  const { data, error } = await supabaseAdmin.from('events').update(dbUpdates).eq('id', eventId).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCommunityAction(communityId, updates, token) {
  await verifyUser(token);
  
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.image !== undefined) dbUpdates.cover_image = updates.image;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.subscription_price !== undefined) dbUpdates.subscription_price = updates.subscription_price;
  if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
  if (updates.require_approval !== undefined) dbUpdates.require_approval = updates.require_approval;
  
  const { data, error } = await supabaseAdmin.from('communities').update(dbUpdates).eq('id', communityId).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createChannelAction(channelData, token) {
  await verifyUser(token);
  
  const { data, error } = await supabaseAdmin.from('channels').insert({
    id: channelData.id,
    community_id: channelData.communityId,
    name: channelData.name,
    type: channelData.type || 'text'
  }).select().single();
  
  if (error) throw new Error(error.message);
  return data;
}

export async function markNotificationReadAction(notificationId, token) {
  await verifyUser(token);
  
  const { error } = await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', notificationId);
  if (error) throw new Error(error.message);
  return true;
}

export async function updateUserAction(userId, updates, token) {
  await verifyUser(token, userId);
  
  const { error } = await supabaseAdmin.from('users').update(updates).eq('id', userId);
  if (error) throw new Error(error.message);
  return true;
}

export async function adminVerifyCommunityAction(communityId, verified, token) {
  await verifyUser(token);
  
  const { error } = await supabaseAdmin.from('communities').update({ verified }).eq('id', communityId);
  if (error) throw new Error(error.message);
  return true;
}
