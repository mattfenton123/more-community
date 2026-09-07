const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // 1. Find Matthew Fenton
  const { data: users, error: fetchErr } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%Matthew Fenton%');
    
  if (fetchErr || !users.length) {
    console.error("Could not find Matthew Fenton", fetchErr);
    return;
  }
  
  const matt = users[0];
  
  // 2. Auth User ID
  const email = 'admin@more-community.com';
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const authUser = existingUser.users.find(u => u.email === email);
  if (!authUser) {
      console.error("Auth user not found!");
      return;
  }
  
  const newUserId = authUser.id;
  console.log("New User ID:", newUserId);
  
  // 3. Update public.users
  const newProfile = {
    ...matt,
    id: newUserId,
    name: 'Administrator'
  };
  delete newProfile.email; // Just in case matt had an email key accidentally appended
  
  console.log("Upserting profile...");
  const { error: upsertErr } = await supabase.from('users').upsert(newProfile);
  if (upsertErr) console.error("Profile Upsert Error:", upsertErr);
  else console.log("Profile updated successfully!");
  
  // 4. Copy Community Memberships
  console.log("Fetching memberships...");
  const { data: memberships } = await supabase.from('community_members').select('*').eq('user_id', matt.id);
  if (memberships && memberships.length > 0) {
     for (const m of memberships) {
       const copy = { ...m, user_id: newUserId };
       delete copy.id;
       await supabase.from('community_members').insert(copy).catch(e => {}); 
     }
     console.log(`Copied ${memberships.length} memberships`);
  }
  
  // 5. Copy Community Roles
  console.log("Fetching roles...");
  const { data: roles } = await supabase.from('community_roles').select('*').eq('user_id', matt.id);
  if (roles && roles.length > 0) {
     for (const r of roles) {
       const copy = { ...r, user_id: newUserId };
       delete copy.id;
       await supabase.from('community_roles').insert(copy).catch(e => {});
     }
     console.log(`Copied ${roles.length} roles`);
  }
  
  console.log("Done!");
}

run();
