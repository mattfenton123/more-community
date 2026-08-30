"use server";

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:admin@more-community.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
    channel: messageData.channel,
    author_id: messageData.authorId,
    text: messageData.text,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
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
    image: communityData.cover_image || communityData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(communityData.name)}&background=0D8B93&color=fff&size=512`,
    lat: communityData.lat || null,
    lng: communityData.lng || null,
    target_audience: communityData.target_audience,
    location_name: communityData.location_name,
    cost: communityData.cost,
    activity_level: communityData.activity_level,
    leader_id: communityData.creatorId
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
  const { error } = await supabaseAdmin.from('communities').upsert([{
    id: 'more-leaders-network',
    name: 'The more. Leaders Network',
    description: 'A private space for more. leaders to collaborate, share tips, and organize cross-community events.',
    tags: ['leadership', 'network'],
    leader_id: null,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    activity_level: 'Active',
    location_name: 'Global',
    cost: 'Free for Leaders'
  }], { onConflict: 'id' });
  if (error) console.error('Failed to ensure Leaders Network:', error);
}

export async function createEventAction(eventData, token) {
  // In a real app we'd verify the user is a leader of the community, but for demo:
  await verifyUser(token);

  const { data, error } = await supabaseAdmin.from('events').insert({
    id: eventData.id || crypto.randomUUID(),
    community_id: eventData.communityId,
    title: eventData.title,
    date: eventData.date,
    time: eventData.time,
    location: eventData.location,
    image: eventData.image,
    attendees: eventData.attendees || 0,
    description: eventData.description || '',
    status: eventData.status || 'published',
    max_capacity: eventData.maxCapacity || null,
    ticket_price: eventData.ticketPrice || 0
  }).select().single();

  if (error) throw new Error(error.message);
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
      status: status
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

export async function broadcastNotificationAction(notifications, token) {
  await verifyUser(token);
  const { error } = await supabaseAdmin.from('notifications').insert(notifications);
  if (error) throw new Error(error.message);
  return true;
}

export async function promoteMemberAction(communityId, memberId, newRole, token) {
  await verifyUser(token);
  const { error } = await supabaseAdmin.from('community_memberships')
    .update({ role: newRole })
    .match({ community_id: communityId, user_id: memberId });
  if (error) throw new Error(error.message);
  return true;
}

export async function removeMemberAction(communityId, memberId, token) {
  await verifyUser(token);
  const { error } = await supabaseAdmin.from('community_memberships')
    .delete()
    .match({ community_id: communityId, user_id: memberId });
  if (error) throw new Error(error.message);
  return true;
}



export async function sendDirectMessageAction(senderId, receiverId, text, image, token) {
  await verifyUser(token, senderId);
  const { data, error } = await supabaseAdmin.from('direct_messages').insert([{
    sender_id: senderId, receiver_id: receiverId, text, image
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

export async function createFeedPostAction(communityId, authorId, content, mediaUrl, token) {
  try {
    await verifyUser(token, authorId);
    const { data, error } = await supabaseAdmin.from('feed_posts').insert([{
      community_id: communityId, author_id: authorId, text: content, media: mediaUrl, likes: 0
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
      const newLikes = Math.max(0, (post.likes || 0) + (increment ? 1 : -1));
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
  await verifyUser(token);
  
  // First, delete any comments associated with this post (messages table)
  await supabaseAdmin.from('messages').delete().eq('channel', postId);
  
  // Then, delete the post itself
  const { error } = await supabaseAdmin.from('feed_posts').delete().eq('id', postId);
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteCommentAction(commentId, postId, token) {
  await verifyUser(token);
  
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
  await verifyUser(token);
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

export async function deleteCommunityAction(communityId, token) {
  try {
    await verifyUser(token);
    
    // Delete all related records
    await supabaseAdmin.from('community_memberships').delete().eq('community_id', communityId);
    await supabaseAdmin.from('feed_posts').delete().eq('community_id', communityId);
    await supabaseAdmin.from('events').delete().eq('community_id', communityId);
    
    const { error } = await supabaseAdmin.from('communities').delete().eq('id', communityId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteUserAction(userId, token) {
  try {
    await verifyUser(token);
    
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
