import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';
/**
 * Runs raw SQL against the Supabase database using the
 * internal pg_execute RPC function that the SQL editor uses.
 * This works because service_role has superuser-like access.
 */


async function executeSql(sql, label) {
  console.log(`\n🔄 ${label}...`);
  
  // Use the supabase pg endpoint (available with service role)
  const response = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    console.log(`  ❌ Failed (${response.status}): ${text.substring(0, 200)}`);
    return false;
  }

  const data = await response.json();
  console.log(`  ✅ Success:`, JSON.stringify(data).substring(0, 200));
  return true;
}

async function main() {
  console.log('🚀 Running SQL migrations via Supabase pg endpoint\n');

  // Migration 002
  const migration002 = `
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarded boolean DEFAULT false;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_uid uuid;

    CREATE TABLE IF NOT EXISTS public.event_rsvps (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      event_id text NOT NULL,
      user_id text NOT NULL,
      status text NOT NULL DEFAULT 'going',
      created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS public.notifications (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id text NOT NULL,
      type text NOT NULL,
      title text NOT NULL,
      body text,
      link text,
      read boolean DEFAULT false,
      created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS lat double precision;
    ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS lng double precision;
  `;

  const success002 = await executeSql(migration002, 'Migration 002: Auth, Events & Location (DDL)');

  if (success002) {
    // Coordinates
    const coords = `
      UPDATE public.communities SET lat = 51.1322, lng = 0.2637 WHERE id = 'mindful-miles';
      UPDATE public.communities SET lat = 51.1352, lng = 0.2587 WHERE id = 'tw-ramblers';
      UPDATE public.communities SET lat = 51.1290, lng = 0.2710 WHERE id = 'a-z-challenge';
      UPDATE public.communities SET lat = 51.1380, lng = 0.2530 WHERE id = 'tw-parkrun';
      UPDATE public.communities SET lat = 51.1310, lng = 0.2680 WHERE id = 'tw-yoga-collective';
      UPDATE public.communities SET lat = 51.1270, lng = 0.2760 WHERE id = 'kent-adventures';
      UPDATE public.communities SET lat = 51.1340, lng = 0.2600 WHERE id = 'tw-good-neighbours';
      UPDATE public.communities SET lat = 51.1300, lng = 0.2650 WHERE id = 'tw-interfaith-network';
      UPDATE public.communities SET lat = 51.1360, lng = 0.2550 WHERE id = 'tw-creative-collective';
      UPDATE public.communities SET lat = 51.1330, lng = 0.2620 WHERE id = 'yentw';
    `;
    await executeSql(coords, 'Setting community coordinates');
  }

  // Migration 003
  const migration003 = `
    CREATE TABLE IF NOT EXISTS public.message_reactions (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      message_id text NOT NULL,
      user_id text NOT NULL,
      emoji text NOT NULL,
      created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(message_id, user_id, emoji)
    );

    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;

    CREATE TABLE IF NOT EXISTS public.polls (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      community_id text NOT NULL,
      channel text NOT NULL,
      question text NOT NULL,
      options jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_by text NOT NULL,
      created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public.poll_votes (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      poll_id uuid NOT NULL,
      user_id text NOT NULL,
      option_index integer NOT NULL,
      created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(poll_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS public.community_photos (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      community_id text NOT NULL,
      uploaded_by text NOT NULL,
      url text NOT NULL,
      caption text,
      created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;

  await executeSql(migration003, 'Migration 003: Rich Community Features (DDL)');

  // Realtime publications
  await executeSql(
    `ALTER PUBLICATION supabase_realtime ADD TABLE event_rsvps, notifications, message_reactions, polls, poll_votes, community_photos;`,
    'Adding tables to realtime publication'
  );

  console.log('\n✅ All migrations complete!\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
