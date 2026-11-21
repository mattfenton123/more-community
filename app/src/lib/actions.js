"use server";

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@more-community.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch(e) {
    console.error("Failed to initialize webpush:", e);
  }
}

function isValidServiceRoleKey(key, url) {
  if (!key) return false;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (payload.ref) {
      const urlHost = new URL(url).hostname;
      if (!urlHost.includes(payload.ref)) {
        console.warn(`[Supabase] Service role key ref (${payload.ref}) does not match URL host (${urlHost}). Falling back to safe client.`);
        return false;
      }
    }
    return payload.role === 'service_role';
  } catch (e) {
    return false;
  }
}

// Instantiate Supabase client using Service Role Key (bypasses RLS) if valid, or Anon Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';

const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasValidServiceKey = isValidServiceRoleKey(rawServiceKey, supabaseUrl);
const serviceRoleKey = hasValidServiceKey ? rawServiceKey : null;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Returns a client scoped to the user's bearer token so Postgres RLS can inspect auth.uid()
function getSupabaseClient(token) {
  if (hasValidServiceKey) {
    return supabaseAdmin;
  }
  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }
  return supabaseAdmin;
}

const ADMIN_EMAILS = [
  'msf199@hotmail.com',
  'mattfenton123@gmail.com',
  'matthewfenton123@gmail.com',
  'matt@inspiredventures.co.uk',
  'alex@maorecommunity.co.uk',
  'alex@morecommunity.co.uk',
  'matt@morecommunity.app',
  'alex@morecommunity.app'
];

function isUserRecordSuspended(row) {
  if (!row) return false;
  if (row.is_suspended === true || row.role === 'Suspended') return true;
  if (Array.isArray(row.interests)) {
    for (const item of row.interests) {
      if (typeof item === 'string' && item.startsWith('__profile_meta:')) {
        try {
          const parsed = JSON.parse(item.slice('__profile_meta:'.length));
          if (parsed && parsed.is_suspended === true) return true;
        } catch (e) {}
      }
    }
  }
  return false;
}

async function verifyUser(token, expectedUserId, { allowSuspended = false } = {}) {
  if (!token) throw new Error("Missing authentication token");
  const authClient = hasValidServiceKey
    ? supabaseAdmin
    : createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) throw new Error("Invalid or expired token");
  if (expectedUserId && user.id !== expectedUserId) throw new Error("Unauthorized: User ID mismatch");

  if (!allowSuspended && !isAdminUser(user)) {
    try {
      const { data: dbRow } = await supabaseAdmin
        .from('users')
        .select('role, interests')
        .eq('id', user.id)
        .maybeSingle();
      if (isUserRecordSuspended(dbRow)) {
        throw new Error("Account Suspended: Your account has been suspended by a platform administrator.");
      }
    } catch (suspErr) {
      if (suspErr?.message?.startsWith('Account Suspended:')) throw suspErr;
    }
  }
  return user;
}

async function verifyAdmin(token) {
  const user = await verifyUser(token);
  if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

function isAdminUser(user) {
  return !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

// Returns 'Leader' | 'Co-Leader' | 'Member' | null for a user in a community.
// Checks communities.leader_id first so a creator/leader is never locked out of their own group.
async function getCommunityRole(userId, communityId, client) {
  if (!userId || !communityId) return null;
  const db = client || supabaseAdmin;

  if (communityId === 'more-leaders-network' && userId === 'a31edbf0-db87-4a32-b108-c13d365adbf8') {
    return 'Leader';
  }

  const { data: community } = await db.from('communities')
    .select('leader_id')
    .eq('id', communityId)
    .maybeSingle();
  if (community?.leader_id === userId) return 'Leader';

  const { data: membership } = await db.from('community_memberships')
    .select('role')
    .match({ user_id: userId, community_id: communityId })
    .maybeSingle();
  if (membership?.role) return membership.role;

  return null;
}

// Ensures the verified manager has a Leader/Co-Leader row in community_memberships so Postgres RLS permits writes when service_role key is absent.
async function ensureRlsManagerMembership(db, userId, communityId, isAdmin = false) {
  if (!userId || !communityId || hasValidServiceKey) return;
  try {
    const { data: mem } = await db.from('community_memberships')
      .select('role')
      .match({ user_id: userId, community_id: communityId })
      .maybeSingle();
    const targetRole = isAdmin ? 'Co-Leader' : 'Leader';
    if (!mem) {
      await db.from('community_memberships').insert({
        community_id: communityId,
        user_id: userId,
        role: targetRole
      });
    } else if (mem.role !== 'Leader' && mem.role !== 'Co-Leader') {
      // Verified manager whose row says 'Member': replace it (own-row DELETE + INSERT are allowed by RLS)
      await db.from('community_memberships')
        .delete()
        .match({ community_id: communityId, user_id: userId });
      await db.from('community_memberships').insert({
        community_id: communityId,
        user_id: userId,
        role: targetRole
      });
    }
  } catch (e) {
    console.warn('RLS membership sync warning:', e?.message || e);
  }
}

// Requires the caller to be a Leader/Co-Leader (or Leader only) of the community, or a platform admin.
async function verifyCommunityManager(token, communityId, { leaderOnly = false } = {}) {
  const user = await verifyUser(token);
  if (!communityId) throw new Error("Missing community");
  if (isAdminUser(user)) return { user, role: 'Admin', isAdmin: true };
  const role = await getCommunityRole(user.id, communityId);
  const allowed = leaderOnly ? role === 'Leader' : (role === 'Leader' || role === 'Co-Leader');
  if (!allowed) {
    throw new Error(leaderOnly
      ? "Forbidden: Only the community leader can do this"
      : "Forbidden: Community leader access required");
  }
  return { user, role, isAdmin: false };
}

export async function sendMessageAction(messageData, token) {
  if (!messageData.authorId) throw new Error("Unauthorized");
  await verifyUser(token, messageData.authorId);
  
  const { data, error } = await supabaseAdmin.from('messages').insert({
    community_id: messageData.communityId,
    channel: messageData.channel,
    author_id: messageData.authorId,
    text: messageData.text,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    image: messageData.image || null,
    parent_id: messageData.parentId || null
  }).select().single();
  
  if (error) throw new Error(error.message);
  
  // --- WhatsApp Broadcast (Outbound Sync) ---
  try {
    const { data: community } = await supabaseAdmin.from('communities').select('whatsapp_group_id').eq('id', messageData.communityId).single();
    
    if (community?.whatsapp_group_id && process.env.WHATSAPP_ACCESS_TOKEN) {
      const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
      const targetGroupId = community.whatsapp_group_id;

      // 2. Fetch the sender's name to attribute the message
      const { data: user } = await supabaseAdmin.from('users').select('name').eq('id', messageData.authorId).single();
      const senderName = user?.name || 'A member';
      
      const whatsappPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual", // Changed to individual for standard Cloud API compatibility in MVP, would be group with Twilio or specialized Meta access
        to: targetGroupId,
        type: "text",
        text: { 
          body: `*${senderName}* (via More Community app):\n${messageData.text}` 
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
    tags: communityData.tags || [],
    image: communityData.cover_image || communityData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(communityData.name)}&background=0D8B93&color=fff&size=512`,
    lat: communityData.lat || null,
    lng: communityData.lng || null,
    target_audience: communityData.target_audience || null,
    location_name: communityData.location_name || null,
    cost: communityData.cost || 'Free',
    activity_level: communityData.activity_level || 'Active',
    leader_id: communityData.creatorId || null,
    whatsapp_group: communityData.whatsapp_group || null,
    instagram_handle: communityData.instagram_handle || null,
    external_links: Array.isArray(communityData.external_links) ? communityData.external_links : []
  }).select().single();

  if (error) throw new Error(error.message);

  // Automatically make the creator a leader
  if (communityData.creatorId) {
    const { error: membershipError } = await supabaseAdmin.from('community_memberships').insert({
      community_id: data.id,
      user_id: communityData.creatorId,
      role: 'Leader'
    });
    
    if (membershipError) {
      console.error("Failed to add creator as leader:", membershipError);
      // We don't throw here to avoid failing the community creation entirely, 
      // but in a production app we'd handle this more robustly.
    }
  }

  return data;
}

export async function joinCommunityAction(userId, communityId, token) {
  try {
    if (!userId || !communityId) return { error: "Missing data" };
    await verifyUser(token, userId);

    const { data, error } = await supabaseAdmin.from('community_memberships').insert({
      user_id: userId,
      community_id: communityId,
      role: 'Member'
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - already joined
        return { data: { user_id: userId, community_id: communityId, role: 'Member' } };
      }
      return { error: error.message };
    }

    // Server-side notification to community leaders & co-leaders
    try {
      const [{ data: comm }, { data: memberUser }, { data: managers }] = await Promise.all([
        supabaseAdmin.from('communities').select('id, name, leader_id').eq('id', communityId).maybeSingle(),
        supabaseAdmin.from('users').select('name').eq('id', userId).maybeSingle(),
        supabaseAdmin.from('community_memberships').select('user_id, role').eq('community_id', communityId).in('role', ['Leader', 'Co-Leader']),
      ]);
      if (comm && communityId !== 'more-leaders-network') {
        const recipientIds = new Set();
        if (comm.leader_id) recipientIds.add(comm.leader_id);
        (managers || []).forEach(m => { if (m?.user_id) recipientIds.add(m.user_id); });
        recipientIds.delete(userId);

        if (recipientIds.size > 0) {
          const memberName = memberUser?.name || 'A new member';
          const notifs = Array.from(recipientIds).map(lid => ({
            user_id: lid,
            type: 'member',
            title: `👋 New Member in ${comm.name}`,
            message: `${memberName} has joined ${comm.name}!`,
            link: `/dashboard?tab=people&community=${communityId}`,
            is_read: false,
          }));
          await supabaseAdmin.from('notifications').insert(notifs);
        }
      }
    } catch (notifErr) {
      console.warn('Could not notify leaders on member join:', notifErr?.message || notifErr);
    }

    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function ensureLeadersNetworkAction() {
  const ALEX_USER_ID = 'a31edbf0-db87-4a32-b108-c13d365adbf8';
  const { error } = await supabaseAdmin.from('communities').upsert([{
    id: 'more-leaders-network',
    name: 'More Community Leaders Network',
    description: 'A private space for More Community leaders to collaborate, share tips, and organize cross-community events.',
    tags: ['leadership', 'network'],
    leader_id: ALEX_USER_ID,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    activity_level: 'Active',
    location_name: 'Global',
    cost: 'Free for Leaders'
  }], { onConflict: 'id' });
  if (error) console.error('Failed to ensure Leaders Network:', error);

  // Ensure Alex is listed as Leader in community_memberships
  await supabaseAdmin.from('community_memberships').upsert([{
    community_id: 'more-leaders-network',
    user_id: ALEX_USER_ID,
    role: 'Leader'
  }], { onConflict: 'community_id,user_id' });
}

export async function createEventAction(eventData, token) {
  const { user, isAdmin } = await verifyCommunityManager(token, eventData.communityId);
  const db = getSupabaseClient(token);

  // Ensure caller has Leader/Co-Leader membership in community_memberships so Postgres RLS allows the insert
  if (user?.id) {
    try {
      const { data: mem } = await db.from('community_memberships')
        .select('role')
        .match({ user_id: user.id, community_id: eventData.communityId })
        .maybeSingle();
      if (!mem || (mem.role !== 'Leader' && mem.role !== 'Co-Leader')) {
        await db.from('community_memberships').upsert([{
          community_id: eventData.communityId,
          user_id: user.id,
          role: isAdmin ? 'Co-Leader' : 'Leader'
        }], { onConflict: 'community_id,user_id' });
      }
    } catch (e) {
      console.warn('Membership sync in createEventAction:', e?.message || e);
    }
  }

  const payload = {
    id: eventData.id || crypto.randomUUID(),
    community_id: eventData.communityId,
    title: String(eventData.title).trim(),
    date: eventData.date,
    time: eventData.time,
    location: String(eventData.location).trim(),
    image: eventData.image || null,
    attendees: eventData.attendees || 0,
    description: eventData.description || '',
    status: eventData.status || 'published',
    max_capacity: eventData.maxCapacity ? parseInt(eventData.maxCapacity, 10) : null,
    ticket_price: eventData.ticketPrice != null ? Math.max(0, Number(eventData.ticketPrice)) : (eventData.ticket_price != null ? Math.max(0, Number(eventData.ticket_price)) : 0),
    cohost_community_ids: Array.isArray(eventData.collabCommunityIds) ? eventData.collabCommunityIds : (Array.isArray(eventData.cohost_community_ids) ? eventData.cohost_community_ids : [])
  };

  const { data, error } = await db.from('events').insert(payload).select().single();

  if (error) {
    console.error('Event creation failed:', error);
    throw new Error(error.message);
  }
  return data;
}

export async function proposeEventAction(eventData, token) {
  const user = await verifyUser(token);
  const communityId = eventData?.communityId;
  if (!communityId) throw new Error('Missing community ID');

  const isAdmin = isAdminUser(user);

  // Verify the caller is a member (or leader/admin) of the target community
  const { data: comm } = await supabaseAdmin
    .from('communities')
    .select('id, name, leader_id')
    .eq('id', communityId)
    .maybeSingle();
  if (!comm) throw new Error('Community not found');

  if (!isAdmin && comm.leader_id !== user.id) {
    const { data: mem } = await supabaseAdmin
      .from('community_memberships')
      .select('role')
      .match({ community_id: communityId, user_id: user.id })
      .maybeSingle();
    if (!mem) {
      throw new Error('Join this community first before proposing an event.');
    }
  }

  // Resolve proposer's display name
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle();
  const proposerName = profile?.name || eventData.proposerName || 'A member';

  const cleanTitle = String(eventData.title || '').replace(/^\[Proposal\]\s*/i, '').trim();
  if (!cleanTitle) throw new Error('Event title is required');

  const baseDesc = String(eventData.description || '').trim();
  const taggedDesc = `${baseDesc ? `${baseDesc}\n\n` : ''}Proposed by ${proposerName} [ProposedByUid:${user.id}]`;

  const payload = {
    id: crypto.randomUUID(),
    community_id: communityId,
    title: cleanTitle,
    date: eventData.date,
    time: eventData.time || '10:00',
    location: String(eventData.location || 'Local Area').trim(),
    image: eventData.image || null,
    attendees: 0,
    description: taggedDesc,
    status: 'proposed', // Always enforced server-side so members cannot self-publish
    max_capacity: null,
    ticket_price: 0,
    cohost_community_ids: [],
  };

  const { data, error } = await supabaseAdmin.from('events').insert(payload).select().single();
  if (error) {
    console.error('Event proposal failed:', error);
    throw new Error(error.message);
  }

  // Alert all Leaders & Co-Leaders of this community immediately via in-app notifications
  try {
    const { data: managers } = await supabaseAdmin
      .from('community_memberships')
      .select('user_id, role')
      .eq('community_id', communityId)
      .in('role', ['Leader', 'Co-Leader']);

    const recipientIds = new Set();
    if (comm.leader_id) recipientIds.add(comm.leader_id);
    (managers || []).forEach((m) => {
      if (m.user_id) recipientIds.add(m.user_id);
    });

    const notifications = Array.from(recipientIds).map((uid) => ({
      user_id: uid,
      type: 'event_proposal',
      title: `💡 New Event Proposal for ${comm.name}`,
      message: `${proposerName} proposed "${cleanTitle}" for ${eventData.date}${eventData.time ? ` at ${eventData.time}` : ''}. Review & publish in your Leader Dashboard.`,
      link: `/dashboard?tab=events&community=${communityId}`,
      is_read: false,
    }));

    if (notifications.length > 0) {
      await supabaseAdmin.from('notifications').insert(notifications);
    }
  } catch (notifErr) {
    console.warn('Could not notify leaders of event proposal:', notifErr?.message || notifErr);
  }

  return data;
}

export async function createEventsBatchAction(eventsData, token) {
  if (!Array.isArray(eventsData) || eventsData.length === 0) return [];
  if (eventsData.length > 52) {
    throw new Error("Batch limit exceeded: Maximum 52 events can be scheduled in a single batch.");
  }

  const communityId = eventsData[0].communityId;
  if (!communityId) throw new Error("Missing community ID for event batch");

  // Prevent cross-community batch injection
  if (eventsData.some(e => e.communityId !== communityId)) {
    throw new Error("Unauthorized: All events in a batch must belong to the same community.");
  }

  const { user, isAdmin } = await verifyCommunityManager(token, communityId);
  const db = getSupabaseClient(token);

  if (user?.id) {
    try {
      const { data: mem } = await db.from('community_memberships')
        .select('role')
        .match({ user_id: user.id, community_id: communityId })
        .maybeSingle();
      if (!mem || (mem.role !== 'Leader' && mem.role !== 'Co-Leader')) {
        await db.from('community_memberships').upsert([{
          community_id: communityId,
          user_id: user.id,
          role: isAdmin ? 'Co-Leader' : 'Leader'
        }], { onConflict: 'community_id,user_id' });
      }
    } catch (e) {
      console.warn('Membership sync in createEventsBatchAction:', e?.message || e);
    }
  }

  const payloads = eventsData.map(eventData => {
    if (!eventData.title || !eventData.date || !eventData.time || !eventData.location) {
      throw new Error("Invalid event data: title, date, time, and location are required.");
    }
    return {
      id: eventData.id || crypto.randomUUID(),
      community_id: communityId,
      title: String(eventData.title).trim(),
      date: eventData.date,
      time: eventData.time,
      location: String(eventData.location).trim(),
      image: eventData.image || null,
      attendees: eventData.attendees || 0,
      description: eventData.description || '',
      status: eventData.status || 'published',
      max_capacity: eventData.maxCapacity ? parseInt(eventData.maxCapacity, 10) : null,
      ticket_price: eventData.ticketPrice != null ? Math.max(0, Number(eventData.ticketPrice)) : (eventData.ticket_price != null ? Math.max(0, Number(eventData.ticket_price)) : 0),
      cohost_community_ids: Array.isArray(eventData.collabCommunityIds) ? eventData.collabCommunityIds : (Array.isArray(eventData.cohost_community_ids) ? eventData.cohost_community_ids : [])
    };
  });

  const { data, error } = await db.from('events').insert(payloads).select();

  if (error) {
    console.error('Batch event creation failed:', error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function leaveCommunityAction(userId, communityId, token) {
  try {
    if (!userId || !communityId) return { error: "Missing data" };
    await verifyUser(token, userId);

    const { error } = await supabaseAdmin.from('community_memberships')
      .delete()
      .eq('user_id', userId)
      .eq('community_id', communityId);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function flagCommunityAction(communityId, reason, token) {
  const user = await verifyUser(token);
  const db = getSupabaseClient(token);
  
  const { error } = await db.from('communities').update({
    is_flagged: true,
    flag_reason: reason || 'Flagged by user'
  }).eq('id', communityId);
  
  if (error) {
    if (error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204') {
      console.warn(`Community ${communityId} flagged by ${user.id} (reason: ${reason || 'Flagged by user'}), but is_flagged column is not migrated yet.`);
      return true;
    }
    throw new Error(error.message);
  }
  return true;
}

export async function rsvpToEventAction(userId, eventId, status, ticketType, referredBy, token, metadata = {}) {
  if (!userId || !eventId) throw new Error("Missing data");
  await verifyUser(token, userId);

  if (status === 'not_going') {
    const { error } = await supabaseAdmin.from('event_rsvps')
      .delete()
      .match({ user_id: userId, event_id: eventId });
    if (error) throw new Error(error.message);
  } else {
    const rsvpData = {
      user_id: userId,
      event_id: eventId,
      status: status
    };
    if (ticketType) rsvpData.ticket_type = ticketType;
    if (referredBy) rsvpData.referred_by = referredBy;
    if (metadata.guestName) rsvpData.guest_name = metadata.guestName;
    if (metadata.answer) rsvpData.answer = metadata.answer;
    
    let { error } = await supabaseAdmin.from('event_rsvps').upsert([rsvpData], { onConflict: 'event_id,user_id' });
    
    // Fallback if Postgres schema doesn't have custom columns yet: pack into referred_by safely
    if (error && (error.message?.includes('guest_name') || error.message?.includes('answer'))) {
      const fallbackRsvp = {
        user_id: userId,
        event_id: eventId,
        status: status
      };
      if (ticketType) fallbackRsvp.ticket_type = ticketType;
      const metaParts = [];
      if (referredBy && !referredBy.startsWith('meta:')) metaParts.push(`ref:${referredBy}`);
      if (metadata.guestName) metaParts.push(`guest:${metadata.guestName}`);
      if (metadata.answer) metaParts.push(`ans:${metadata.answer}`);
      
      fallbackRsvp.referred_by = metaParts.length > 0 ? `meta:${metaParts.join(';;')}` : (referredBy || null);
      
      const retry = await supabaseAdmin.from('event_rsvps').upsert([fallbackRsvp], { onConflict: 'event_id,user_id' });
      if (retry.error) throw new Error(retry.error.message);
    } else if (error) {
      throw new Error(error.message);
    }

    // Server-side notification to event community leaders on positive RSVP / approval request
    try {
      const [{ data: ev }, { data: rsvpUser }] = await Promise.all([
        supabaseAdmin.from('events').select('id, title, community_id').eq('id', eventId).maybeSingle(),
        supabaseAdmin.from('users').select('name').eq('id', userId).maybeSingle(),
      ]);
      if (ev?.community_id) {
        const [{ data: comm }, { data: managers }] = await Promise.all([
          supabaseAdmin.from('communities').select('leader_id').eq('id', ev.community_id).maybeSingle(),
          supabaseAdmin.from('community_memberships').select('user_id, role').eq('community_id', ev.community_id).in('role', ['Leader', 'Co-Leader']),
        ]);
        const recipientIds = new Set();
        if (comm?.leader_id) recipientIds.add(comm.leader_id);
        (managers || []).forEach(m => { if (m?.user_id) recipientIds.add(m.user_id); });
        recipientIds.delete(userId);

        if (recipientIds.size > 0) {
          const attendeeName = rsvpUser?.name || 'A member';
          const guestNote = metadata?.guestName ? ` (with guest ${metadata.guestName})` : '';
          const isApprovalReq = status === 'pending_approval';
          const isWaitlist = status === 'waitlist';
          const notifTitle = isApprovalReq
            ? `⏳ Approval Request: ${ev.title}`
            : isWaitlist
            ? `📋 Waitlist Joined: ${ev.title}`
            : `🎫 New RSVP for ${ev.title}`;
          const notifMsg = isApprovalReq
            ? `${attendeeName} requested approval to join "${ev.title}"${guestNote}. Review on the event page.`
            : isWaitlist
            ? `${attendeeName} joined the waitlist for "${ev.title}"${guestNote}.`
            : `${attendeeName} booked a spot for "${ev.title}"${guestNote}!`;

          const notifs = Array.from(recipientIds).map(lid => ({
            user_id: lid,
            type: 'rsvp',
            title: notifTitle,
            message: notifMsg,
            link: `/events/${eventId}`,
            is_read: false,
          }));
          await supabaseAdmin.from('notifications').insert(notifs);
        }
      }
    } catch (notifErr) {
      console.warn('Could not notify leaders on RSVP:', notifErr?.message || notifErr);
    }
  }
  return true;
}

export async function addEventPhotoAction(eventId, photoUrl, token) {
  if (!eventId || !photoUrl) throw new Error("Missing parameters");
  const authUser = await verifyUser(token);
  const db = hasValidServiceKey ? supabaseAdmin : getSupabaseClient(token);

  const { data: event, error: fetchErr } = await db
    .from('events')
    .select('gallery_images, community_id, cohost_community_ids')
    .eq('id', eventId)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (!event) throw new Error("Event not found");

  // Enforce: Only confirmed attendees (going / checked_in) or Leaders / Co-Leaders / Admins can upload event photos
  if (!isAdminUser(authUser)) {
    const commIds = [
      event.community_id,
      ...(Array.isArray(event.cohost_community_ids) ? event.cohost_community_ids : []),
    ].filter(Boolean);
    const roles = await Promise.all(commIds.map(cid => getCommunityRole(authUser.id, cid, db)));
    const isManager = roles.some(r => r === 'Leader' || r === 'Co-Leader');

    if (!isManager) {
      const { data: rsvp } = await db
        .from('event_rsvps')
        .select('status, checked_in')
        .match({ event_id: eventId, user_id: authUser.id })
        .maybeSingle();
      const didAttend = Boolean(rsvp && (rsvp.status === 'going' || rsvp.status === 'checked_in' || rsvp.checked_in));
      if (!didAttend) {
        throw new Error("Only confirmed event attendees and community leaders can add photos to this event.");
      }
    }
  }

  const currentGallery = Array.isArray(event.gallery_images) ? event.gallery_images : [];
  const updatedGallery = [...currentGallery, photoUrl];

  const { error } = await db
    .from('events')
    .update({ gallery_images: updatedGallery })
    .eq('id', eventId);

  if (error) throw new Error(error.message);
  return updatedGallery;
}

export async function updateAttendeeStatusAction(eventId, attendeeUserId, newStatus, token) {
  if (!eventId || !attendeeUserId || !newStatus) throw new Error("Missing parameters");
  const hostUser = await verifyUser(token);

  const { data: event } = await supabaseAdmin.from('events').select('id, title, community_id, host_id').eq('id', eventId).maybeSingle();
  if (event) {
    const role = await getCommunityRole(hostUser.id, event.community_id, supabaseAdmin);
    const isAllowed = role === 'Leader' || role === 'Co-Leader' || event.host_id === hostUser.id || isAdminUser(hostUser);
    if (!isAllowed) throw new Error("Unauthorized: Only hosts can manage attendee approvals");
  }

  const { error } = await supabaseAdmin
    .from('event_rsvps')
    .upsert([{
      user_id: attendeeUserId,
      event_id: eventId,
      status: newStatus
    }], { onConflict: 'event_id,user_id' });

  if (error) throw new Error(error.message);

  // Notify attendee when their request is approved or declined
  if (event && attendeeUserId !== hostUser.id && (newStatus === 'going' || newStatus === 'declined')) {
    try {
      const isApproved = newStatus === 'going';
      const notifTitle = isApproved
        ? `✅ Spot Approved: ${event.title || 'Community Event'}`
        : `RSVP Update: ${event.title || 'Community Event'}`;
      const notifMsg = isApproved
        ? `Your request to join "${event.title}" has been approved by the host! Tap to view your pass and exact meeting point.`
        : `The host was unable to approve your request for "${event.title}" this time.`;
      const link = `/events/${eventId}`;

      await supabaseAdmin.from('notifications').insert({
        user_id: attendeeUserId,
        type: 'rsvp',
        title: notifTitle,
        message: notifMsg,
        link,
        is_read: false,
      });

      if (isApproved) {
        await sendPushNotificationAction(attendeeUserId, {
          title: notifTitle,
          body: notifMsg,
          url: link,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not notify attendee of status update:', e?.message || e);
    }
  }

  return true;
}

export async function uploadImageAction(formData, token) {
  const authUser = await verifyUser(token);
  
  const file = formData.get('file');
  const userId = formData.get('userId') || authUser?.id || 'member';
  
  if (!file) throw new Error("No file provided");
  
  const filename = file.name || 'image.webp';
  const rawExt = filename.includes('.') ? filename.split('.').pop().toLowerCase() : 'webp';
  const fileExt = /^[a-z0-9]{1,8}$/.test(rawExt) ? rawExt : 'webp';
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const db = getSupabaseClient(token);
  const { data, error } = await db.storage
    .from('uploads')
    .upload(fileName, buffer, {
      contentType: file.type || 'image/webp',
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw new Error(error.message);
  
  const { data: publicData } = db.storage
    .from('uploads')
    .getPublicUrl(fileName);
    
  return publicData.publicUrl;
}

export async function uploadVideoAction(formData, token) {
  await verifyUser(token);
  
  const file = formData.get('file');
  const userId = formData.get('userId');
  
  if (!file) throw new Error("No file provided");
  
  const filename = file.name || 'video.mp4';
  const fileExt = filename.split('.').pop();
  const fileName = `${userId}/videos/${Date.now()}.${fileExt}`;
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const db = getSupabaseClient(token);
  const { data, error } = await db.storage
    .from('uploads')
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw new Error(error.message);
  
  const { data: publicData } = db.storage
    .from('uploads')
    .getPublicUrl(fileName);
    
  return publicData.publicUrl;
}

export async function updateEventAction(eventId, updates, token) {
  const db = getSupabaseClient(token);
  const { data: existingEvent } = await db.from('events').select('community_id, status, title, description').eq('id', eventId).maybeSingle();
  if (!existingEvent) throw new Error("Event not found");
  const { user, isAdmin } = await verifyCommunityManager(token, existingEvent.community_id);
  await ensureRlsManagerMembership(db, user?.id, existingEvent.community_id, isAdmin);
  
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.time !== undefined) dbUpdates.time = updates.time;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.maxCapacity !== undefined) dbUpdates.max_capacity = updates.maxCapacity;
  if (updates.max_capacity !== undefined) dbUpdates.max_capacity = updates.max_capacity;
  if (updates.ticketPrice !== undefined) dbUpdates.ticket_price = Number(updates.ticketPrice);
  if (updates.ticket_price !== undefined) dbUpdates.ticket_price = Number(updates.ticket_price);
  if (updates.collabCommunityIds !== undefined) dbUpdates.cohost_community_ids = updates.collabCommunityIds;
  if (updates.cohost_community_ids !== undefined) dbUpdates.cohost_community_ids = updates.cohost_community_ids;
  if (updates.galleryImages !== undefined) dbUpdates.gallery_images = updates.galleryImages;
  if (updates.gallery_images !== undefined) dbUpdates.gallery_images = updates.gallery_images;

  const isPublishingProposal = existingEvent.status === 'proposed' && dbUpdates.status === 'published';
  const proposerMatch = String(existingEvent.description || '').match(/\[ProposedByUid:([^\]]+)\]/);
  if (isPublishingProposal && proposerMatch) {
    const baseDesc = dbUpdates.description !== undefined ? dbUpdates.description : existingEvent.description;
    dbUpdates.description = String(baseDesc || '').replace(/\s*\[ProposedByUid:[^\]]+\]/g, '').trim();
  }
  
  const { data, error } = await db.from('events').update(dbUpdates).eq('id', eventId).select().single();
  if (error) {
    console.error('Event update failed:', error);
    throw new Error(error.message);
  }

  // Notify proposing member when their event proposal is approved & published
  if (isPublishingProposal && proposerMatch?.[1] && proposerMatch[1] !== user?.id) {
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: proposerMatch[1],
        type: 'event_proposal_approved',
        title: '🎉 Your Event Idea Was Published!',
        message: `Your proposed event "${data.title}" has been approved and added to the community calendar.`,
        link: `/events/${data.id}`,
        is_read: false,
      });
    } catch (e) {
      console.warn('Could not notify proposer of approval:', e?.message || e);
    }
  }

  return data;
}

const ADMIN_ONLY_COMMUNITY_FIELDS = ['verified', 'is_banned', 'is_flagged', 'flag_reason'];
const MEMBER_EDITABLE_COMMUNITY_FIELDS = ['gallery_photos'];

const photoUrl = (p) => (typeof p === 'string' ? p : p?.url);
const photoOwner = (p) => (typeof p === 'string' ? null : p?.uploaderId);

export async function updateCommunityAction(communityId, updates, token) {
  const user = await verifyUser(token);
  const isAdmin = isAdminUser(user);
  const keys = Object.keys(updates || {}).filter(k => updates[k] !== undefined);

  if (!isAdmin) {
    if (keys.some(k => ADMIN_ONLY_COMMUNITY_FIELDS.includes(k))) {
      throw new Error("Forbidden: Admin access required for these fields");
    }

    const role = await getCommunityRole(user.id, communityId);
    const isManager = role === 'Leader' || role === 'Co-Leader';

    if (!isManager) {
      // Regular members may only add/remove their OWN gallery photos.
      const onlyMemberFields = keys.length > 0 && keys.every(k => MEMBER_EDITABLE_COMMUNITY_FIELDS.includes(k));
      if (!role || !onlyMemberFields) {
        throw new Error("Forbidden: Community leader access required");
      }
      const { data: current } = await supabaseAdmin.from('communities').select('gallery_photos').eq('id', communityId).maybeSingle();
      const before = current?.gallery_photos || [];
      const after = updates.gallery_photos || [];
      const beforeUrls = new Set(before.map(photoUrl));
      const afterUrls = new Set(after.map(photoUrl));
      const added = after.filter(p => !beforeUrls.has(photoUrl(p)));
      const removed = before.filter(p => !afterUrls.has(photoUrl(p)));
      if ([...added, ...removed].some(p => photoOwner(p) !== user.id)) {
        throw new Error("Forbidden: You can only change your own photos");
      }
    }
  }
  
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.image !== undefined) {
    dbUpdates.cover_image = updates.image;
    dbUpdates.image = updates.image;
  }
  if (updates.cover_image !== undefined) {
    dbUpdates.cover_image = updates.cover_image;
    dbUpdates.image = updates.cover_image;
  }
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.subscription_price !== undefined) dbUpdates.subscription_price = updates.subscription_price;
  if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
  if (updates.require_approval !== undefined) dbUpdates.require_approval = updates.require_approval;
  if (updates.external_links !== undefined) dbUpdates.external_links = updates.external_links;
  if (updates.gallery_photos !== undefined) dbUpdates.gallery_photos = updates.gallery_photos;
  if (updates.website !== undefined) dbUpdates.website = updates.website;
  if (updates.whatsapp_group !== undefined) dbUpdates.whatsapp_group = updates.whatsapp_group;
  if (updates.instagram_handle !== undefined) dbUpdates.instagram_handle = updates.instagram_handle;
  if (updates.location_name !== undefined) dbUpdates.location_name = updates.location_name;
  if (updates.lat !== undefined) dbUpdates.lat = updates.lat;
  if (updates.lng !== undefined) dbUpdates.lng = updates.lng;
  if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
  if (updates.activity_level !== undefined) dbUpdates.activity_level = updates.activity_level;
  if (updates.target_audience !== undefined) dbUpdates.target_audience = updates.target_audience;
  if (updates.guidelines !== undefined) dbUpdates.guidelines = updates.guidelines;
  if (updates.highlights !== undefined) dbUpdates.highlights = updates.highlights;
  if (updates.welcome_video_url !== undefined) dbUpdates.welcome_video_url = updates.welcome_video_url;
  if (updates.is_flagged !== undefined) dbUpdates.is_flagged = updates.is_flagged;
  if (updates.flag_reason !== undefined) dbUpdates.flag_reason = updates.flag_reason;
  if (updates.is_banned !== undefined) dbUpdates.is_banned = updates.is_banned;
  if (updates.verified !== undefined) dbUpdates.verified = updates.verified;
  
  const db = getSupabaseClient(token);
  await ensureRlsManagerMembership(db, user?.id, communityId, isAdmin);

  let payload = { ...dbUpdates };
  for (let attempt = 0; attempt < 5; attempt++) {
    if (Object.keys(payload).length === 0) {
      const { data: currentRow } = await db.from('communities').select('*').eq('id', communityId).maybeSingle();
      return { ...(currentRow || { id: communityId }), ...dbUpdates };
    }
    const { data, error } = await db.from('communities').update(payload).eq('id', communityId).select().maybeSingle();
    if (!error) return { ...(data || { id: communityId }), ...dbUpdates };

    // If a column has not been migrated yet in Supabase, strip that missing column and retry remaining fields
    const colMatch = error.message?.match(/column ["']?(?:communities\.)?([a-zA-Z0-9_]+)["']? does not exist/i) ||
                     error.message?.match(/Could not find the ['"]([a-zA-Z0-9_]+)['"] column/i);
    if (colMatch && colMatch[1] && payload[colMatch[1]] !== undefined) {
      console.warn(`[updateCommunityAction] Stripping unmigrated column "${colMatch[1]}" and retrying...`);
      delete payload[colMatch[1]];
      continue;
    }
    throw new Error(error.message);
  }
  return { id: communityId, ...dbUpdates };
}

export async function createChannelAction(channelData, token) {
  const { user, isAdmin } = await verifyCommunityManager(token, channelData.communityId);
  const db = getSupabaseClient(token);
  await ensureRlsManagerMembership(db, user?.id, channelData.communityId, isAdmin);
  
  const { data, error } = await db.from('channels').insert({
    id: channelData.id,
    community_id: channelData.communityId,
    name: channelData.name,
    type: channelData.type || 'text',
    member_ids: channelData.memberIds || null
  }).select().single();
  
  if (error) throw new Error(error.message);
  return data;
}

export async function markNotificationReadAction(notificationId, token) {
  const user = await verifyUser(token);
  
  const { error } = await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', notificationId).eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return true;
}

export async function markAllNotificationsReadAction(token) {
  const user = await verifyUser(token);

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
  return true;
}

export async function updateUserAction(userId, updates, token) {
  const user = await verifyUser(token, undefined, { allowSuspended: true });
  const isAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  if (user.id !== userId && !isAdmin) {
    throw new Error("Unauthorized: User ID mismatch");
  }
  const db = getSupabaseClient(token);
  
  const sanitized = { ...updates };
  delete sanitized.banner;
  delete sanitized.affinityProfile;
  delete sanitized.headline;
  delete sanitized.location;
  delete sanitized.vibes;
  delete sanitized.instagram;
  delete sanitized.website;

  // Persist admin user suspension in both is_suspended column, role, and __profile_meta
  if (sanitized.is_suspended !== undefined) {
    if (!isAdmin) {
      throw new Error("Forbidden: Only administrators can suspend or unsuspend users");
    }
    const targetSuspended = Boolean(sanitized.is_suspended);
    sanitized.is_suspended = targetSuspended;

    const { data: existingRow } = await db
      .from('users')
      .select('role, interests')
      .eq('id', userId)
      .maybeSingle();

    const baseInterests = Array.isArray(sanitized.interests ?? existingRow?.interests)
      ? (sanitized.interests ?? existingRow?.interests)
      : [];
    let existingMeta = {};
    const cleanInterests = [];
    baseInterests.forEach(item => {
      if (typeof item === 'string' && item.startsWith('__profile_meta:')) {
        try {
          const parsed = JSON.parse(item.slice('__profile_meta:'.length));
          if (parsed && typeof parsed === 'object') existingMeta = { ...existingMeta, ...parsed };
        } catch (e) {}
      } else if (typeof item === 'string' && item.trim()) {
        cleanInterests.push(item.trim());
      }
    });

    const nextMeta = { ...existingMeta, is_suspended: targetSuspended };
    sanitized.interests = [...cleanInterests, `__profile_meta:${JSON.stringify(nextMeta)}`];
    const prevRole = existingRow?.role || 'Member';
    sanitized.role = targetSuspended
      ? 'Suspended'
      : (prevRole === 'Suspended' ? (existingMeta.previous_role || 'Member') : prevRole);
  }

  let payload = { ...sanitized };
  for (let attempt = 0; attempt < 5; attempt++) {
    if (Object.keys(payload).length === 0) return true;
    const { error } = await db.from('users').update(payload).eq('id', userId);
    if (!error) return true;

    const colMatch =
      error.message?.match(/column ["']?(?:users\.)?([a-zA-Z0-9_]+)["']? does not exist/i) ||
      error.message?.match(/Could not find the ['"]([a-zA-Z0-9_]+)['"] column/i);
    if (colMatch && colMatch[1] && payload[colMatch[1]] !== undefined) {
      delete payload[colMatch[1]];
      continue;
    }
    console.error('User update failed:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function adminVerifyCommunityAction(communityId, verified, token) {
  await verifyAdmin(token);
  const db = getSupabaseClient(token);
  const { error } = await db.from('communities').update({ verified }).eq('id', communityId);
  if (error) throw new Error(error.message);
  return true;
}

export async function notifyCommunityLeadersAction(communityId, { title, message, link, type = 'alert' } = {}, token) {
  const caller = await verifyUser(token);
  if (!communityId || !title) throw new Error("Missing community notification details");

  const [{ data: comm }, { data: managers }] = await Promise.all([
    supabaseAdmin.from('communities').select('id, name, leader_id').eq('id', communityId).maybeSingle(),
    supabaseAdmin
      .from('community_memberships')
      .select('user_id, role')
      .eq('community_id', communityId)
      .in('role', ['Leader', 'Co-Leader']),
  ]);

  if (!comm) throw new Error("Community not found");

  const recipientIds = new Set();
  if (comm.leader_id) recipientIds.add(comm.leader_id);
  (managers || []).forEach(m => { if (m?.user_id) recipientIds.add(m.user_id); });
  if (recipientIds.size > 1) recipientIds.delete(caller.id);

  if (recipientIds.size === 0) return true;

  const targetLink = link || `/dashboard?tab=overview&community=${communityId}`;
  const rows = Array.from(recipientIds).map(uid => ({
    user_id: uid,
    type,
    title,
    message: message || '',
    link: targetLink,
    is_read: false,
  }));

  const { error } = await supabaseAdmin.from('notifications').insert(rows);
  if (error) throw new Error(error.message);
  return true;
}

export async function broadcastNotificationAction(notifications, token, communityId = null) {
  const user = await verifyUser(token);
  if (!Array.isArray(notifications) || notifications.length === 0) return true;

  if (!isAdminUser(user)) {
    let targetCommId = communityId;
    const firstLink = notifications?.[0]?.link || '';
    if (!targetCommId && firstLink) {
      const commPathMatch = firstLink.match(/\/community\/([^/?#]+)/);
      const commQueryMatch = firstLink.match(/[?&]community=([^&#]+)/);
      if (commPathMatch) targetCommId = commPathMatch[1];
      else if (commQueryMatch) targetCommId = commQueryMatch[1];
    }

    if (targetCommId) {
      const role = await getCommunityRole(user.id, targetCommId);
      const isManager = role === 'Leader' || role === 'Co-Leader';
      const isMemberIdea = role === 'Member' && notifications.every(n => n.type === 'idea' || String(n.title || '').includes('💡'));

      // Also allow a parent community's Leader to notify a child chapter's leader (e.g. chapter approval/decline)
      let isParentLeaderOfChapter = false;
      if (!isManager && !isMemberIdea) {
        const { data: targetComm } = await supabaseAdmin.from('communities').select('tags, external_links').eq('id', targetCommId).maybeSingle();
        const cfgTag = (targetComm?.tags || []).find(t => typeof t === 'string' && t.startsWith('__cfg:'));
        const parentMatch = cfgTag?.match(/parent=([^,]+)/);
        const parentId = parentMatch?.[1] || (targetComm?.external_links || []).find(x => x?.__type === 'community_settings')?.parent_community_id;
        if (parentId) {
          const parentRole = await getCommunityRole(user.id, parentId);
          isParentLeaderOfChapter = parentRole === 'Leader' || parentRole === 'Co-Leader';
        }
      }

      if (!isManager && !isMemberIdea && !isParentLeaderOfChapter) {
        throw new Error("Forbidden: Only community leaders or admins can broadcast");
      }
    } else {
      throw new Error("Forbidden: Admin access required for platform broadcast");
    }
  }
  const { error } = await supabaseAdmin.from('notifications').insert(notifications);
  if (error) throw new Error(error.message);
  return true;
}

export async function sendEventReminderAction(eventId, customMessage, token) {
  const user = await verifyUser(token);
  
  const { data: event, error: eventErr } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventErr || !event) {
    throw new Error("Event not found");
  }

  if (!isAdminUser(user)) {
    const role = await getCommunityRole(user.id, event.community_id);
    if (role !== 'Leader' && role !== 'Co-Leader') {
      throw new Error("Forbidden: Only community leaders or admins can send event reminders");
    }
  }

  const { data: rsvps, error: rsvpErr } = await supabaseAdmin
    .from('event_rsvps')
    .select('user_id, status')
    .eq('event_id', eventId);

  if (rsvpErr) {
    throw new Error("Failed to load attendees: " + rsvpErr.message);
  }

  const attendees = (rsvps || []).filter(r => r.status === 'going' || r.status === 'checked_in' || !r.status);

  if (attendees.length === 0) {
    return { success: true, count: 0, message: 'No registered attendees to notify.' };
  }

  const cleanLoc = event.location ? String(event.location).replace(/\s*•\s*@-?\d+\.?\d*,-?\d+\.?\d*/g, '').replace(/\s*\[r=\d+\.?\d*km\]/gi, '').trim() : '';
  const defaultMsg = `⏰ Reminder: ${event.title} is coming up${event.date ? ' on ' + event.date : ''}${event.time ? ' at ' + event.time : ''}${cleanLoc ? ' at ' + cleanLoc : ''}! Looking forward to seeing you there.`;

  const notifications = attendees.map(r => ({
    user_id: r.user_id,
    type: 'reminder',
    title: `⏰ Reminder: ${event.title}`,
    message: customMessage?.trim() || defaultMsg,
    link: `/events/${event.id}`,
    is_read: false
  }));

  const { error: notifErr } = await supabaseAdmin.from('notifications').insert(notifications);
  if (notifErr) {
    throw new Error("Failed to create notifications: " + notifErr.message);
  }

  return { success: true, count: notifications.length };
}

export async function createSelfNotificationAction(notification, token) {
  const user = await verifyUser(token);
  
  const payload = {
    user_id: user.id,
    type: notification.type || 'reminder',
    title: notification.title || 'Notification',
    message: notification.message || '',
    link: notification.link || '/',
    is_read: false
  };

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function promoteMemberAction(communityId, memberId, newRole, token) {
  const { user, isAdmin } = await verifyCommunityManager(token, communityId, { leaderOnly: true });
  if (!['Member', 'Co-Leader'].includes(newRole)) throw new Error("Invalid role");
  if (memberId === user.id && !isAdmin) throw new Error("You cannot change your own role");
  
  const targetRole = await getCommunityRole(memberId, communityId);
  if (targetRole === 'Leader') throw new Error("The community leader's role cannot be changed");
  
  // Check if membership row exists
  const { data: existing } = await supabaseAdmin.from('community_memberships')
    .select('id')
    .match({ community_id: communityId, user_id: memberId })
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin.from('community_memberships')
      .update({ role: newRole })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin.from('community_memberships').insert({
      community_id: communityId,
      user_id: memberId,
      role: newRole,
      joined_at: new Date().toISOString()
    });
    if (error) throw new Error(error.message);
  }
  return true;
}

export async function createPollAction(communityId, question, options, token) {
  await verifyUser(token);
  
  const { data, error } = await supabaseAdmin.from('polls').insert({
    community_id: communityId,
    question,
    options
  }).select().single();
  
  if (error) throw new Error(error.message);
  return data;
}

export async function votePollAction(pollId, userId, optionIndex, token) {
  await verifyUser(token, userId);
  
  const { data, error } = await supabaseAdmin.from('poll_votes').upsert([{
    poll_id: pollId,
    user_id: userId,
    option_index: optionIndex
  }], { onConflict: 'poll_id,user_id' }).select().single();
  
  if (error) throw new Error(error.message);
  return data;
}

export async function removeMemberAction(communityId, memberId, token) {
  const { role: callerRole } = await verifyCommunityManager(token, communityId);
  const targetRole = await getCommunityRole(memberId, communityId);
  if (targetRole === 'Leader') throw new Error("The community leader cannot be removed");
  if (targetRole === 'Co-Leader' && callerRole !== 'Leader' && callerRole !== 'Admin') {
    throw new Error("Only the leader can remove a co-leader");
  }
  const { error } = await supabaseAdmin.from('community_memberships')
    .delete()
    .match({ community_id: communityId, user_id: memberId });
  if (error) throw new Error(error.message);
  return true;
}



export async function sendDirectMessageAction(senderId, receiverId, text, image, parentId, token) {
  await verifyUser(token, senderId);
  const { data, error } = await supabaseAdmin.from('direct_messages').insert([{
    sender_id: senderId, receiver_id: receiverId, text, image, parent_id: parentId || null
  }]).select().single();
  
  if (error) throw new Error(error.message);
  
  // Send push notification
  const { data: sender } = await supabaseAdmin.from('users').select('name').eq('id', senderId).single();
  await sendPushNotificationAction(receiverId, {
    title: `New message from ${sender?.name || 'someone'}`,
    body: text || (image ? 'Sent an image' : 'Sent a message'),
    url: `/chat/dm/${senderId}`
  });

  return data;
}

export async function createFeedPostAction(communityId, authorId, content, mediaUrl, isAnnouncement = false, isPinned = false, token) {
  try {
    await verifyUser(token, authorId);
    const { data, error } = await supabaseAdmin.from('feed_posts').insert([{
      community_id: communityId, author_id: authorId, text: content, media: mediaUrl, likes: 0,
      is_announcement: isAnnouncement, is_pinned: isPinned
    }]).select().single();
    if (error) return { error: error.message };
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function toggleFeedPostLikeAction(postId, userId, increment, token) {
  try {
    await verifyUser(token, userId);
    const { data: post } = await supabaseAdmin.from('feed_posts').select('likes').eq('id', postId).single();
    if (post) {
      const newLikes = Math.max(0, (post.likes || 0) + increment);
      await supabaseAdmin.from('feed_posts').update({ likes: newLikes }).eq('id', postId);
      return { liked: increment, likes: newLikes };
    }
    return { error: 'Post not found' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function createFeedPostCommentAction(postId, communityId, authorId, text, mediaUrl = null, token) {
  try {
    await verifyUser(token, authorId);
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { data, error } = await supabaseAdmin.from('messages').insert([{
      community_id: communityId,
      channel: postId,
      author_id: authorId,
      text: text,
      timestamp: timestamp,
      image: mediaUrl
    }]).select().single();
    
    if (error) {
      return { error: error.message };
    }
    
    const { data: post } = await supabaseAdmin.from('feed_posts').select('comments, author_id, community_id').eq('id', postId).single();
    if (post) {
      await supabaseAdmin.from('feed_posts').update({ comments: (post.comments || 0) + 1 }).eq('id', postId);
      
      if (post.author_id && post.author_id !== authorId) {
        const { data: author } = await supabaseAdmin.from('users').select('name').eq('id', authorId).single();
        const targetCommId = communityId || post.community_id;
        const targetUrl = targetCommId ? `/community/${targetCommId}` : '/app';
        const authorName = author?.name || 'A member';

        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: post.author_id,
            type: 'comment',
            title: `💬 New comment from ${authorName}`,
            message: text,
            link: targetUrl,
            is_read: false,
          });
        } catch (e) {}

        await sendPushNotificationAction(post.author_id, {
          title: `New comment from ${authorName}`,
          body: text,
          url: targetUrl
        });
      }
    }
    
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function subscribeToPushNotificationsAction(userId, subscription, token) {
  await verifyUser(token, userId);
  
  const { data: existing } = await supabaseAdmin
    .from('community_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('community_id', '_push_notifications_')
    .single();

  if (existing) {
    await supabaseAdmin.from('community_memberships').update({ role: JSON.stringify(subscription) }).eq('id', existing.id);
  } else {
    await supabaseAdmin.from('community_memberships').insert({
      user_id: userId,
      community_id: '_push_notifications_',
      role: JSON.stringify(subscription)
    });
  }
  return true;
}

export async function sendPushNotificationAction(userId, payload) {
  // Internal helper function
  const { data: sub } = await supabaseAdmin
    .from('community_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('community_id', '_push_notifications_')
    .single();

  if (sub && sub.role) {
    try {
      const subscription = JSON.parse(sub.role);
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (e) {
      console.error('Push notification failed:', e);
      if (e.statusCode === 410 || e.statusCode === 404) {
        await supabaseAdmin.from('community_memberships').delete().eq('user_id', userId).eq('community_id', '_push_notifications_');
      }
    }
  }
}

export async function deleteFeedPostAction(postId, token) {
  const user = await verifyUser(token);
  const { data: post } = await supabaseAdmin.from('feed_posts').select('author_id, community_id').eq('id', postId).maybeSingle();
  if (!post) throw new Error("Post not found");
  if (post.author_id !== user.id && !isAdminUser(user)) {
    const role = await getCommunityRole(user.id, post.community_id);
    if (role !== 'Leader' && role !== 'Co-Leader') throw new Error("Forbidden: You can't delete this post");
  }
  
  // First, delete any comments associated with this post (messages table)
  await supabaseAdmin.from('messages').delete().eq('channel', postId);
  
  // Then, delete the post itself
  const { error } = await supabaseAdmin.from('feed_posts').delete().eq('id', postId);
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteCommentAction(commentId, postId, token) {
  const user = await verifyUser(token);
  const { data: comment } = await supabaseAdmin.from('messages').select('author_id, community_id').eq('id', commentId).maybeSingle();
  if (!comment) throw new Error("Comment not found");
  if (comment.author_id !== user.id && !isAdminUser(user)) {
    const role = await getCommunityRole(user.id, comment.community_id);
    if (role !== 'Leader' && role !== 'Co-Leader') throw new Error("Forbidden: You can't delete this comment");
  }
  
  const { error } = await supabaseAdmin.from('messages').delete().eq('id', commentId);
  if (error) throw new Error(error.message);
  
  // Decrement the comment count on the post
  const { data: post } = await supabaseAdmin.from('feed_posts').select('comments').eq('id', postId).single();
  if (post && post.comments > 0) {
    await supabaseAdmin.from('feed_posts').update({ comments: post.comments - 1 }).eq('id', postId);
  }
  return true;
}

export async function reportMemberAction(reportedUserId, communityId, reason, token) {
  await verifyUser(token);
  
  // Simply inserting into a 'reports' table or logging it. 
  // For simplicity, we'll store reports in the 'messages' table under a special channel if a reports table doesn't exist.
  // Or better, we can just return success and log it for now.
  console.log(`Member ${reportedUserId} reported in community ${communityId} for: ${reason}`);
  return true;
}

export async function getUserLikesAction(postIds, userId, token) {
  // Mock this since we don't have a feed_post_likes table
  // Users will rely on localStorage for their own 'liked' state across refreshes
  return [];
}

export async function getCommentsAction(postId, token) {
  const { data, error } = await supabaseAdmin.from('messages')
    .select('*')
    .eq('channel', postId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('getCommentsAction error (likely table missing):', error.message);
    return [];
  }
  return data;
}

export async function updateMessageAction(messageId, updates, token) {
  const user = await verifyUser(token);
  const { data: message } = await supabaseAdmin.from('messages').select('author_id, community_id').eq('id', messageId).maybeSingle();
  if (!message) throw new Error("Message not found");
  if (message.author_id !== user.id && !isAdminUser(user)) {
    const role = await getCommunityRole(user.id, message.community_id);
    if (role !== 'Leader' && role !== 'Co-Leader') throw new Error("Forbidden: You can't edit this message");
  }
  const { data, error } = await supabaseAdmin
    .from('messages')
    .update(updates)
    .eq('id', messageId)
    .select()
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Postgres/PostgREST codes meaning "this optional table doesn't exist in this deployment".
const MISSING_TABLE_CODES = ['42P01', 'PGRST205', 'PGRST200'];

export async function deleteCommunityAction(communityId, token, confirmName) {
  try {
    const { data: community } = await supabaseAdmin.from('communities').select('id, name').eq('id', communityId).maybeSingle();
    if (!community) throw new Error("Community not found");
    if (community.id === 'more-leaders-network') throw new Error("This community cannot be deleted");

    // Only the Leader (or a platform admin) may delete; Co-Leaders may not.
    await verifyCommunityManager(token, communityId, { leaderOnly: true });

    // Server-side repeat of the UI safeguard: caller must supply the exact community name.
    if (!confirmName || confirmName !== community.name) {
      throw new Error("Confirmation name does not match the community name");
    }

    // Fail-fast, ordered cleanup: children first, the community row LAST.
    // If any step fails we abort BEFORE the community is removed, so the group is never left half-deleted
    // without a parent (the operation can simply be retried).
    const run = async (label, promise, { optional = false } = {}) => {
      const { error } = await promise;
      if (error && !(optional && MISSING_TABLE_CODES.includes(error.code))) {
        throw new Error(`Failed while deleting ${label}: ${error.message}`);
      }
    };

    const { data: eventRows } = await supabaseAdmin.from('events').select('id').eq('community_id', communityId);
    const eventIds = (eventRows || []).map(e => e.id);
    if (eventIds.length > 0) {
      await run('event RSVPs', supabaseAdmin.from('event_rsvps').delete().in('event_id', eventIds), { optional: true });
    }

    const { data: pollRows } = await supabaseAdmin.from('polls').select('id').eq('community_id', communityId);
    const pollIds = (pollRows || []).map(p => p.id);
    if (pollIds.length > 0) {
      await run('poll votes', supabaseAdmin.from('poll_votes').delete().in('poll_id', pollIds), { optional: true });
    }
    await run('polls', supabaseAdmin.from('polls').delete().eq('community_id', communityId), { optional: true });

    await run('messages', supabaseAdmin.from('messages').delete().eq('community_id', communityId));
    await run('feed posts', supabaseAdmin.from('feed_posts').delete().eq('community_id', communityId));
    await run('channels', supabaseAdmin.from('channels').delete().eq('community_id', communityId));
    await run('events', supabaseAdmin.from('events').delete().eq('community_id', communityId));
    await run('memberships', supabaseAdmin.from('community_memberships').delete().eq('community_id', communityId));

    const { error } = await supabaseAdmin.from('communities').delete().eq('id', communityId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteUserAction(userId, token) {
  try {
    const caller = await verifyUser(token, undefined, { allowSuspended: true });
    // Users may delete only their own account; platform admins may delete any non-admin account.
    if (caller.id !== userId && !isAdminUser(caller)) {
      throw new Error("Unauthorized: You can only delete your own account");
    }
    const db = getSupabaseClient(token);

    if (caller.id !== userId) {
      const { data: targetRow } = await db
        .from('users')
        .select('id, name')
        .eq('id', userId)
        .maybeSingle();
      if (targetRow?.name && ADMIN_EMAILS.includes(targetRow.name.toLowerCase())) {
        throw new Error("Protected account: Platform administrator accounts cannot be removed.");
      }
    }

    // Clean up all related records across child tables safely
    const safeCleanup = async (promise) => {
      try { await promise; } catch (e) {}
    };

    await Promise.all([
      safeCleanup(db.from('community_memberships').delete().eq('user_id', userId)),
      safeCleanup(db.from('event_rsvps').delete().eq('user_id', userId)),
      safeCleanup(db.from('notifications').delete().eq('user_id', userId)),
      safeCleanup(db.from('chat_read_receipts').delete().eq('user_id', userId)),
      safeCleanup(db.from('event_carpool_passengers').delete().eq('user_id', userId)),
      safeCleanup(db.from('event_carpools').delete().eq('driver_id', userId)),
      safeCleanup(db.from('event_comments').delete().eq('author_id', userId)),
      safeCleanup(db.from('poll_votes').delete().eq('user_id', userId)),
      safeCleanup(db.from('feed_posts').delete().eq('author_id', userId)),
      safeCleanup(db.from('messages').delete().eq('author_id', userId)),
      safeCleanup(db.from('direct_messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)),
      safeCleanup(db.from('communities').update({ leader_id: null }).eq('leader_id', userId)),
    ]);

    const { error: dbError } = await db.from('users').delete().eq('id', userId);
    if (dbError) throw new Error(dbError.message);

    if (hasValidServiceKey) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (authErr) {
        console.warn('Auth user delete notice (public profile already removed):', authErr?.message || authErr);
      }
    }

    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}


export async function submitReviewAction(userId, targetId, targetType, rating, content, token) {
  await verifyUser(token, userId);
  
  if (!userId || !targetId || !targetType || !rating) {
    throw new Error("Missing required fields for review");
  }
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const reviewId = crypto.randomUUID();
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert([
      {
        id: reviewId,
        user_id: userId,
        target_id: targetId,
        target_type: targetType,
        rating,
        content
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error submitting review:", error);
    // The insert may have succeeded but select failed (RLS), return constructed review
    return {
      id: reviewId,
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      rating,
      content,
      created_at: new Date().toISOString()
    };
  }

  return data;
}

// ─── Admin Moderation Actions ─────────────────────────────
export async function dismissFlagAction(communityId, token) {
  await verifyAdmin(token);
  const { error } = await supabaseAdmin.from('communities').update({ is_flagged: false, flag_reason: null }).eq('id', communityId);
  if (error) throw new Error(error.message);
  return true;
}

export async function banCommunityAction(communityId, token) {
  await verifyAdmin(token);
  const { error } = await supabaseAdmin.from('communities').update({ is_banned: true, is_flagged: false, flag_reason: null }).eq('id', communityId);
  if (error) throw new Error(error.message);
  return true;
}

export async function unbanCommunityAction(communityId, token) {
  await verifyAdmin(token);
  const { error } = await supabaseAdmin.from('communities').update({ is_banned: false }).eq('id', communityId);
  if (error) throw new Error(error.message);
  return true;
}

export async function addReactionAction(messageId, isDirectMessage, emoji, userId, token) {
  await verifyUser(token, userId);
  const table = isDirectMessage ? 'direct_message_reactions' : 'message_reactions';
  
  const { data, error } = await supabaseAdmin.from(table).insert({
    message_id: messageId,
    user_id: userId,
    emoji: emoji
  }).select().single();
  
  if (error) {
    if (error.code === '23505') return { success: true }; // already reacted
    throw new Error(error.message);
  }
  return data;
}

export async function removeReactionAction(messageId, isDirectMessage, emoji, userId, token) {
  await verifyUser(token, userId);
  const table = isDirectMessage ? 'direct_message_reactions' : 'message_reactions';
  
  const { error } = await supabaseAdmin.from(table)
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji);
    
  if (error) throw new Error(error.message);
  return true;
}

// ─── Event Carpools & Discussion ─────────────────────────
function isMissingOptionalTable(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  return MISSING_TABLE_CODES.includes(code) || msg.includes('schema cache') || msg.includes('does not exist');
}

const isMissingCarpoolRelation = isMissingOptionalTable;

export async function offerCarpoolAction(eventId, offerData, token) {
  const authUser = await verifyUser(token);
  const db = getSupabaseClient(token);

  // Safety & Trust Gate: Only members who have attended at least 1 in-person meetup (or Leaders/Co-Leaders/Admins) can offer a ride share
  if (!isAdminUser(authUser)) {
    const { data: ev } = await supabaseAdmin.from('events').select('community_id, cohost_community_ids').eq('id', eventId).maybeSingle();
    const commIds = [ev?.community_id, ...(Array.isArray(ev?.cohost_community_ids) ? ev.cohost_community_ids : [])].filter(Boolean);
    const roles = await Promise.all(commIds.map(cid => getCommunityRole(authUser.id, cid, supabaseAdmin)));
    const isManager = roles.some(r => r === 'Leader' || r === 'Co-Leader');

    if (!isManager) {
      const todayIso = new Date().toISOString().split('T')[0];
      const { data: myRsvps } = await supabaseAdmin
        .from('event_rsvps')
        .select('event_id, status, checked_in')
        .eq('user_id', authUser.id);
      const goingEventIds = (myRsvps || [])
        .filter(r => r.status === 'going' || r.status === 'checked_in' || r.checked_in)
        .map(r => r.event_id);
      const hasCheckedInAny = (myRsvps || []).some(r => r.checked_in || r.status === 'checked_in');
      let hasAttendedPastMeetup = hasCheckedInAny;

      if (!hasAttendedPastMeetup && goingEventIds.length > 0) {
        const { data: pastEvents } = await supabaseAdmin
          .from('events')
          .select('id, date')
          .in('id', goingEventIds)
          .lt('date', todayIso)
          .limit(1);
        hasAttendedPastMeetup = Boolean(pastEvents && pastEvents.length > 0);
      }

      if (!hasAttendedPastMeetup) {
        throw new Error('For community safety, offering a carpool ride unlocks after you have attended your first in-person meetup.');
      }
    }
  }

  const payload = {
    id: offerData.id || `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    event_id: eventId,
    driver_id: authUser.id,
    origin: String(offerData.origin || '').trim(),
    departure_time: String(offerData.time || '').trim(),
    seats_total: Math.max(1, Math.min(12, Number(offerData.seatsTotal) || 3)),
    flexible_on_route: Boolean(offerData.flexibleOnRoute),
    notes: String(offerData.notes || '').trim(),
    chip_in: String(offerData.chipIn || 'Free').trim(),
  };

  // Replace existing offer from the same driver for this event cleanly
  await db.from('event_carpools')
    .delete()
    .match({ event_id: eventId, driver_id: authUser.id });

  const { data, error } = await db.from('event_carpools')
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (isMissingCarpoolRelation(error)) {
      return { localOnly: true };
    }
    throw new Error(error.message);
  }
  return { carpool: data };
}

export async function reserveCarpoolSeatAction(eventId, carpoolId, token) {
  const authUser = await verifyUser(token);
  const db = getSupabaseClient(token);

  const { data: pool, error: poolErr } = await db.from('event_carpools')
    .select('id, seats_total, driver_id, origin')
    .eq('id', carpoolId)
    .maybeSingle();

  if (poolErr) {
    if (isMissingCarpoolRelation(poolErr)) return { localOnly: true };
    throw new Error(poolErr.message);
  }
  if (!pool) {
    return { localOnly: true };
  }

  const { data: currentPassengers, error: passErr } = await db.from('event_carpool_passengers')
    .select('user_id')
    .eq('carpool_id', carpoolId);

  if (passErr) {
    if (isMissingCarpoolRelation(passErr)) return { localOnly: true };
    throw new Error(passErr.message);
  }

  if ((currentPassengers || []).some(r => r.user_id === authUser.id)) {
    return { alreadyReserved: true };
  }
  if ((currentPassengers || []).length >= (Number(pool.seats_total) || 0)) {
    throw new Error('Sorry, this lift just filled up!');
  }

  const { error: insErr } = await db.from('event_carpool_passengers').insert({
    carpool_id: carpoolId,
    event_id: eventId,
    user_id: authUser.id,
  });

  if (insErr) {
    if (insErr.code === '23505') return { alreadyReserved: true };
    if (isMissingCarpoolRelation(insErr)) return { localOnly: true };
    throw new Error(insErr.message);
  }

  // Notify carpool driver when a seat is reserved
  if (pool.driver_id && pool.driver_id !== authUser.id) {
    try {
      const [{ data: passenger }, { data: ev }] = await Promise.all([
        supabaseAdmin.from('users').select('name').eq('id', authUser.id).maybeSingle(),
        supabaseAdmin.from('events').select('title').eq('id', eventId).maybeSingle(),
      ]);
      const passengerName = passenger?.name || 'A member';
      const eventTitle = ev?.title || 'the event';
      const link = `/events/${eventId}#carpool`;
      await supabaseAdmin.from('notifications').insert({
        user_id: pool.driver_id,
        type: 'carpool',
        title: `🚗 Carpool Seat Reserved`,
        message: `${passengerName} reserved a seat in your lift${pool.origin ? ` from ${pool.origin}` : ''} for "${eventTitle}".`,
        link,
        is_read: false,
      });
      await sendPushNotificationAction(pool.driver_id, {
        title: '🚗 Carpool Seat Reserved',
        body: `${passengerName} reserved a seat in your lift for "${eventTitle}".`,
        url: link,
      }).catch(() => {});
    } catch (e) {}
  }

  return { reserved: true };
}

export async function cancelCarpoolSeatAction(carpoolId, token) {
  const authUser = await verifyUser(token);
  const db = getSupabaseClient(token);

  const { error } = await db.from('event_carpool_passengers')
    .delete()
    .match({ carpool_id: carpoolId, user_id: authUser.id });

  if (error && !isMissingCarpoolRelation(error)) {
    throw new Error(error.message);
  }
  return { cancelled: true };
}

export async function deleteCarpoolOfferAction(carpoolId, token) {
  const authUser = await verifyUser(token);
  const db = getSupabaseClient(token);

  const { error } = await db.from('event_carpools')
    .delete()
    .match({ id: carpoolId, driver_id: authUser.id });

  if (error && !isMissingCarpoolRelation(error)) {
    throw new Error(error.message);
  }
  return { deleted: true };
}

export async function createEventCommentAction(eventId, text, token, clientCommentId = null) {
  const authUser = await verifyUser(token);
  const cleanedText = String(text || '').trim();
  if (!cleanedText) throw new Error('Please write a message first.');
  if (cleanedText.length > 1000) throw new Error('Messages must be 1,000 characters or fewer.');

  const db = getSupabaseClient(token);
  const id = clientCommentId || `ec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = {
    id,
    event_id: eventId,
    author_id: authUser.id,
    text: cleanedText,
  };

  const { data, error } = await db.from('event_comments')
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (isMissingOptionalTable(error)) return { localOnly: true };
    throw new Error(error.message);
  }

  // Non-blocking notifications for hosts, co-leaders, co-hosts, and previous thread participants
  if (hasValidServiceKey) {
    try {
      const [{ data: ev }, { data: author }, { data: prevComments }] = await Promise.all([
        supabaseAdmin.from('events').select('title, community_id, cohost_community_ids').eq('id', eventId).maybeSingle(),
        supabaseAdmin.from('users').select('name').eq('id', authUser.id).maybeSingle(),
        supabaseAdmin.from('event_comments').select('author_id').eq('event_id', eventId),
      ]);

      const commIds = new Set();
      if (ev?.community_id) commIds.add(ev.community_id);
      if (Array.isArray(ev?.cohost_community_ids)) {
        ev.cohost_community_ids.filter(Boolean).forEach((cid) => commIds.add(cid));
      }

      const leaderIds = new Set();
      if (commIds.size > 0) {
        const commIdList = Array.from(commIds);
        const [{ data: comms }, { data: coLeaderRows }] = await Promise.all([
          supabaseAdmin.from('communities').select('leader_id').in('id', commIdList),
          supabaseAdmin
            .from('community_memberships')
            .select('user_id, role')
            .in('community_id', commIdList)
            .in('role', ['Leader', 'Co-Leader']),
        ]);
        (comms || []).forEach((c) => { if (c?.leader_id) leaderIds.add(c.leader_id); });
        (coLeaderRows || []).forEach((m) => { if (m?.user_id) leaderIds.add(m.user_id); });
      }

      const recipientIds = new Set();
      leaderIds.forEach((uid) => { if (uid && uid !== authUser.id) recipientIds.add(uid); });
      (prevComments || []).forEach((pc) => {
        if (pc?.author_id && pc.author_id !== authUser.id) recipientIds.add(pc.author_id);
      });

      if (recipientIds.size > 0) {
        const senderName = author?.name || 'Someone';
        const isAuthorHost = leaderIds.has(authUser.id);
        const preview = cleanedText.length > 120 ? `${cleanedText.slice(0, 117)}...` : cleanedText;
        const notifTitle = isAuthorHost
          ? `💬 Host replied on ${ev?.title || 'an event'}`
          : `💬 Event Q&A: ${ev?.title || 'Event discussion'}`;
        const link = `/events/${eventId}#discussion`;

        const rows = Array.from(recipientIds).map((uid) => ({
          user_id: uid,
          title: notifTitle,
          message: `${senderName}: "${preview}"`,
          type: 'event',
          link,
        }));
        await supabaseAdmin.from('notifications').insert(rows);

        await Promise.all(
          Array.from(recipientIds).map((uid) =>
            sendPushNotificationAction(uid, {
              title: `${senderName} in ${ev?.title || 'Event Q&A'}`,
              body: preview,
              url: link,
            }).catch(() => {})
          )
        );
      }
    } catch {}
  }

  return { comment: data };
}

export async function deleteEventCommentAction(commentId, token) {
  const authUser = await verifyUser(token);
  const db = hasValidServiceKey ? supabaseAdmin : getSupabaseClient(token);

  const { data: comment, error: fetchErr } = await db.from('event_comments')
    .select('id, event_id, author_id')
    .eq('id', commentId)
    .maybeSingle();

  if (fetchErr) {
    if (isMissingOptionalTable(fetchErr)) return { deleted: true, localOnly: true };
    throw new Error(fetchErr.message);
  }
  if (!comment) return { deleted: true };

  if (comment.author_id !== authUser.id && !isAdminUser(authUser)) {
    const { data: ev } = await db.from('events')
      .select('community_id, cohost_community_ids')
      .eq('id', comment.event_id)
      .maybeSingle();
    const communityIds = [
      ev?.community_id,
      ...(Array.isArray(ev?.cohost_community_ids) ? ev.cohost_community_ids : []),
    ].filter(Boolean);
    const roles = await Promise.all(communityIds.map(cid => getCommunityRole(authUser.id, cid, db)));
    if (!roles.some(role => role === 'Leader' || role === 'Co-Leader')) {
      throw new Error('Forbidden: You can only delete your own comments.');
    }
  }

  const { error } = await db.from('event_comments')
    .delete()
    .eq('id', commentId);

  if (error && !isMissingOptionalTable(error)) {
    throw new Error(error.message);
  }
  return { deleted: true };
}

