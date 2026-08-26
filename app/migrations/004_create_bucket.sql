-- Run this in the Supabase SQL Editor to create the 'uploads' bucket
-- and configure it for public access.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true) 
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'uploads');

-- Allow public upload access (Optional if using backend API, but good for direct frontend uploads)
CREATE POLICY "Public Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'uploads');
