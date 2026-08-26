export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { newUserId } = req.body;

  if (!newUserId) {
    return res.status(400).json({ error: 'Missing newUserId' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer': 'return=minimal'
  };

  try {
    // We update all tables that reference 'u_alice' to use newUserId
    const queries = [
      { table: 'community_memberships', body: { user_id: newUserId }, match: '?user_id=eq.u_alice' },
      { table: 'messages', body: { author_id: newUserId }, match: '?author_id=eq.u_alice' },
      { table: 'message_reactions', body: { user_id: newUserId }, match: '?user_id=eq.u_alice' },
      { table: 'poll_votes', body: { user_id: newUserId }, match: '?user_id=eq.u_alice' },
      { table: 'community_photos', body: { uploaded_by: newUserId }, match: '?uploaded_by=eq.u_alice' },
    ];

    for (let q of queries) {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/${q.table}${q.match}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(q.body)
      });
      if (!resp.ok) {
        console.error(`Failed to update ${q.table}:`, await resp.text());
      }
    }

    // Finally, delete the mock user row if we want to clean up, but we'll leave it in case it's used elsewhere.
    // We can also update communities leader if we had a leader column, but leaders are determined by community_memberships.

    return res.status(200).json({ success: true, message: 'Mock data successfully claimed!' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
