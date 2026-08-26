import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';



async function cleanDb() {
  console.log('🧹 Starting DB Cleanup...');

  // Get all users
  const { data: users } = await supabase.from('users').select('id, name, email');
  
  // Find Alex and current user (if current user has a specific email)
  const usersToKeep = users.filter(u => u.name?.toLowerCase().includes('alex') || u.name?.toLowerCase().includes('marcus') || u.email?.toLowerCase().includes('marcus') || u.name?.toLowerCase().includes('demo'));
  
  const idsToKeep = usersToKeep.map(u => u.id);
  console.log('Keeping users:', usersToKeep.map(u => u.name));

  // Delete other users
  for (const user of users) {
    if (!idsToKeep.includes(user.id)) {
      console.log(`Deleting user: ${user.name}`);
      await supabase.from('users').delete().eq('id', user.id);
    }
  }

  // Get all communities
  const { data: communities } = await supabase.from('communities').select('id, name');
  
  const commsToKeep = communities.filter(c => c.name?.toLowerCase().includes('tunbridge'));
  
  const commIdsToKeep = commsToKeep.map(c => c.id);
  console.log('Keeping communities:', commsToKeep.map(c => c.name));

  // Delete other communities
  for (const comm of communities) {
    if (!commIdsToKeep.includes(comm.id)) {
      console.log(`Deleting community: ${comm.name}`);
      await supabase.from('communities').delete().eq('id', comm.id);
    }
  }

  console.log('✅ DB Cleanup complete!');
}

cleanDb().catch(console.error);
