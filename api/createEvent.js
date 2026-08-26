import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventData } = req.body;
  if (!eventData || !eventData.community_id || !eventData.title) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: missing service key' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Insert the event
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (eventError) {
      console.error('Error inserting event:', eventError);
      return res.status(500).json({ error: 'Failed to create event' });
    }

    // 2. Fetch the community to get its name/description for matching
    const { data: community } = await supabase
      .from('communities')
      .select('*')
      .eq('id', eventData.community_id)
      .single();

    if (community) {
      // 3. Fetch all onboarded users
      const { data: users } = await supabase
        .from('users')
        .select('id, interests')
        .eq('onboarded', true);

      if (users && users.length > 0) {
        const notificationsToInsert = [];
        const matchText = `${community.name} ${community.description} ${eventData.title} ${eventData.description || ''}`.toLowerCase();

        for (const u of users) {
          // Check if any of the user's interests match the text
          let isMatch = false;
          if (u.interests && u.interests.length > 0) {
            for (const interest of u.interests) {
              if (matchText.includes(interest.toLowerCase())) {
                isMatch = true;
                break;
              }
            }
          }

          // Generate notification if it matches, or if it's the demo user for showcase purposes
          if (isMatch || u.id.startsWith('bca0') || u.name === 'Test Test') {
            notificationsToInsert.push({
              user_id: u.id,
              type: 'event_match',
              title: 'New Event Match! ✨',
              message: `${community.name} just scheduled "${eventData.title}". This matches your interests!`,
              link: `/community/${community.id}`
            });
          }
        }

        // 4. Insert notifications (if the table exists - catching error gracefully if it hasn't been migrated yet)
        if (notificationsToInsert.length > 0) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notificationsToInsert);
          
          if (notifError) {
            console.error('Notification insert skipped (table may not exist yet):', notifError.message);
          }
        }
      }
    }

    return res.status(200).json({ success: true, event: newEvent });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
