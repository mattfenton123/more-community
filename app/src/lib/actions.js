"use server";

import { createClient } from '@supabase/supabase-js';

// Lazily instantiate Supabase client to prevent Server Component render crashes if env vars are missing
let supabaseAdmin = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY or ANON_KEY is required to run server actions.");
    }
    
    supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supabaseAdmin;
}

async function verifyUser(token, expectedUserId) {
  if (!token) throw new Error("Missing authentication token");
  const adminClient = getSupabaseAdmin();
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) throw new Error("Invalid or expired token");
  if (expectedUserId && user.id !== expectedUserId) throw new Error("Unauthorized: User ID mismatch");
  return user;
}

export async function sendMessageAction(messageData, token) {
  if (!messageData.authorId) throw new Error("Unauthorized");
  await verifyUser(token, messageData.authorId);
  
  const adminClient = getSupabaseAdmin();
  const { data, error } = await adminClient.from('messages').insert({
    community_id: messageData.communityId,
    channel_id: messageData.channel,
    author_id: messageData.authorId,
    text: messageData.text,
    image: messageData.image || null
  }).select().single();
  
  if (error) throw new Error(error.message);
  return data;
}

export async function createCommunityAction(communityData, token) {
  if (!communityData.name) throw new Error("Missing community data");
  if (communityData.creatorId) await verifyUser(token, communityData.creatorId);

  const adminClient = getSupabaseAdmin();
  const { data, error } = await adminClient.from('communities').insert({
    id: communityData.id,
    name: communityData.name,
    description: communityData.description,
    tags: communityData.tags,
    cover_image: communityData.cover_image,
    lat: communityData.lat,
    lng: communityData.lng
  }).select().single();

  if (error) throw new Error(error.message);

  // Automatically make the creator a leader
  if (communityData.creatorId) {
    await adminClient.from('community_memberships').insert({
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

  const adminClient = getSupabaseAdmin();
  const { data, error } = await adminClient.from('community_memberships').insert({
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

  const adminClient = getSupabaseAdmin();
  const { data, error } = await adminClient.from('events').insert({
    ...(eventData.id && { id: eventData.id }),
    community_id: eventData.communityId,
    title: eventData.title,
    description: eventData.description || '',
    date: eventData.date,
    time: eventData.time,
    location: eventData.location,
    image: eventData.image,
    attendees: eventData.attendees || 0,
    status: eventData.status || 'published',
    max_capacity: eventData.maxCapacity || null
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

export async function leaveCommunityAction(userId, communityId, token) {
  if (!userId || !communityId) throw new Error("Missing data");
  await verifyUser(token, userId);

  const adminClient = getSupabaseAdmin();
  const { error } = await adminClient.from('community_memberships')
    .delete()
    .match({ user_id: userId, community_id: communityId });

  if (error) throw new Error(error.message);
  return true;
}

export async function rsvpToEventAction(userId, eventId, status, ticketType, token) {
  if (!userId || !eventId) throw new Error("Missing data");
  await verifyUser(token, userId);

  const adminClient = getSupabaseAdmin();
  if (status === 'not_going') {
    const { error } = await adminClient.from('event_rsvps')
      .delete()
      .match({ user_id: userId, event_id: eventId });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await adminClient.from('event_rsvps').upsert([{
      user_id: userId,
      event_id: eventId,
      status: status,
      ticket_type: ticketType
    }], { onConflict: 'event_id,user_id' });
    if (error) throw new Error(error.message);
  }
  return true;
}
