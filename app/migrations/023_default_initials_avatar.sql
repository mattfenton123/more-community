-- ============================================================
-- Migration 023: Default initials avatars instead of random pravatar faces
-- Run in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar, role, joined, bio)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''), ''),
    'Member',
    'Joined ' || TO_CHAR(NOW(), 'Mon YYYY'),
    'New here.'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear legacy non-seeded placeholder URLs so the app generates crisp local initials
UPDATE public.users
SET avatar = ''
WHERE avatar IS NULL
   OR avatar = '/images/default-avatar.svg'
   OR avatar = 'https://i.pravatar.cc/150'
   OR avatar = 'https://i.pravatar.cc/40'
   OR avatar LIKE 'https://ui-avatars.com/api/%'
   OR avatar LIKE 'https://api.dicebear.com/7.x/initials/%';
