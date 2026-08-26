export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, updates } = req.body;

  if (!userId || !updates) {
    return res.status(400).json({ error: 'Missing userId or updates' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Ensure we only update provided fields to prevent wiping existing data
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.joined !== undefined) dbUpdates.joined = updates.joined;
    if (updates.onboarded !== undefined) dbUpdates.onboarded = updates.onboarded;
    if (updates.interests !== undefined) dbUpdates.interests = updates.interests;

    // Use hardcoded key as fallback if environment variable is missing in Vercel
    const serviceKey = SUPABASE_SERVICE_KEY || 'process.env.SUPABASE_SERVICE_ROLE_KEY';

    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(dbUpdates)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to update user:', errorText);
      return res.status(500).json({ error: 'Failed to update user database record' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
