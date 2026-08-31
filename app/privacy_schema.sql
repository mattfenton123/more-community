ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profile_visibility": "public", 
  "dm_permissions": "anyone", 
  "show_activity": true, 
  "blocked_users": []
}';
