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

// Instantiate Supabase client using Service Role Key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

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

async function verifyUser(token, expectedUserId) {
  if (!token) throw new Error("Missing authentication token");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new Error("Invalid or expired token");
  if (expectedUserId && user.id !== expectedUserId) throw new Error("Unauthorized: User ID mismatch");
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
// Falls back to communities.leader_id so a creator is never locked out of their own group.
async function getCommunityRole(userId, communityId) {
  if (!userId || !communityId) return null;
  const { data: membership } = await supabaseAdmin.from('community_memberships')
    .select('role')
    .match({ user_id: userId, community_id: communityId })
    .maybeSingle();
  if (membership?.role) return membership.role;
  const { data: community } = await supabaseAdmin.from('communities')
    .select('leader_id')
    .eq('id', communityId)
    .maybeSingle();
  return community?.leader_id === userId ? 'Leader' : null;
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
    instagram_handle: communityData.instagram_handle || null
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
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function ensureLeadersNetworkAction() {
  const ALEX_USER_ID = 'a31edbf0-db87-4a32-b108-c13d365adbf8';
  const { error } = await supabaseAdmin.from('communities').upsert([{
    id: 'more-leaders-network',
    name: 'The More. Community Leaders Network',
    description: 'A private space for more. leaders to collaborate, share tips, and organize cross-community events.',
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
  await verifyCommunityManager(token, eventData.communityId);

  const payload = {
    id: eventData.id || crypto.randomUUID(),
    community_id: eventData.communityId,
    title: eventData.title,
    date: eventData.date,
    time: eventData.time,
    location: eventData.location,
    image: eventData.image || null,
    attendees: eventData.attendees || 0,
    description: eventData.description || '',
    status: eventData.status || 'published',
    max_capacity: eventData.maxCapacity || null,
    ticket_price: eventData.ticketPrice != null ? Number(eventData.ticketPrice) : (eventData.ticket_price != null ? Number(eventData.ticket_price) : 0)
  };

  const { data, error } = await supabaseAdmin.from('events').insert(payload).select().single();

  if (error) {
    console.error('Event creation failed:', error);
    throw new Error(error.message);
  }
  return data;
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
  await verifyUser(token);
  
  const { error } = await supabaseAdmin.from('communities').update({
    is_flagged: true,
    flag_reason: reason || 'Flagged by user'
  }).eq('id', communityId);
  
  if (error) throw new Error(error.message);
  return true;
}

export async function rsvpToEventAction(userId, eventId, status, ticketType, referredBy, token) {
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
    if (referredBy) rsvpData.referred_by = referredBy;
    
    const { error } = await supabaseAdmin.from('event_rsvps').upsert([rsvpData], { onConflict: 'event_id,user_id' });
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
  const { data: existingEvent } = await supabaseAdmin.from('events').select('community_id').eq('id', eventId).maybeSingle();
  if (!existingEvent) throw new Error("Event not found");
  await verifyCommunityManager(token, existingEvent.community_id);
  
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
  
  const { data, error } = await supabaseAdmin.from('events').update(dbUpdates).eq('id', eventId).select().single();
  if (error) {
    console.error('Event update failed:', error);
    throw new Error(error.message);
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
  if (updates.whatsapp_group !== undefined) dbUpdates.whatsapp_group = updates.whatsapp_group;
  if (updates.instagram_handle !== undefined) dbUpdates.instagram_handle = updates.instagram_handle;
  if (updates.location_name !== undefined) dbUpdates.location_name = updates.location_name;
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

export async function updateUserAction(userId, updates, token) {
  const user = await verifyUser(token);
  const isAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  if (user.id !== userId && !isAdmin) {
    throw new Error("Unauthorized: User ID mismatch");
  }
  
  const { error } = await supabaseAdmin.from('users').update(updates).eq('id', userId);
  if (error) {
    console.error('User update failed:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function adminVerifyCommunityAction(communityId, verified, token) {
  await verifyAdmin(token);
  
  const { error } = await supabaseAdmin.from('communities').update({ verified }).eq('id', communityId);
  if (error) throw new Error(error.message);
  return true;
}

export async function broadcastNotificationAction(notifications, token) {
  await verifyAdmin(token);
  const { error } = await supabaseAdmin.from('notifications').insert(notifications);
  if (error) throw new Error(error.message);
  return true;
}

export async function promoteMemberAction(communityId, memberId, newRole, token) {
  const { user } = await verifyCommunityManager(token, communityId, { leaderOnly: true });
  if (!['Member', 'Co-Leader'].includes(newRole)) throw new Error("Invalid role");
  if (memberId === user.id) throw new Error("You cannot change your own role");
  const targetRole = await getCommunityRole(memberId, communityId);
  if (!targetRole) throw new Error("User is not a member of this community");
  if (targetRole === 'Leader') throw new Error("The community leader's role cannot be changed");
  const { error } = await supabaseAdmin.from('community_memberships')
    .update({ role: newRole })
    .match({ community_id: communityId, user_id: memberId });
  if (error) throw new Error(error.message);
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
    
    const { data: post } = await supabaseAdmin.from('feed_posts').select('comments, author_id').eq('id', postId).single();
    if (post) {
      await supabaseAdmin.from('feed_posts').update({ comments: (post.comments || 0) + 1 }).eq('id', postId);
      
      if (post.author_id !== authorId) {
        const { data: author } = await supabaseAdmin.from('users').select('name').eq('id', authorId).single();
        await sendPushNotificationAction(post.author_id, {
          title: `New comment from ${author?.name || 'someone'}`,
          body: text,
          url: `/`
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
    const caller = await verifyUser(token);
    // Users may delete only their own account; platform admins may delete any.
    if (caller.id !== userId && !isAdminUser(caller)) {
      throw new Error("Unauthorized: You can only delete your own account");
    }
    
    // Delete all related records
    await supabaseAdmin.from('community_memberships').delete().eq('user_id', userId);
    await supabaseAdmin.from('feed_posts').delete().eq('author_id', userId);
    
    const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', userId);
    if (dbError) throw new Error(dbError.message);
    
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(authError.message);
    
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
