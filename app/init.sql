-- Paste this entirely into the Supabase SQL Editor and hit "Run"

CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id text NOT NULL,
  channel text NOT NULL,
  author_id text NOT NULL,
  text text NOT NULL,
  timestamp text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable realtime broadcasts for this table
begin;
  -- remove the supabase_realtime publication
  drop publication if exists supabase_realtime;
  -- re-create the publication and add the messages table to it
  create publication supabase_realtime for table messages;
commit;
