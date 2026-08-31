"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function submitReview(userId, targetId, targetType, rating, content) {
  if (!userId || !targetId || !targetType || !rating) {
    throw new Error('Missing required fields for review');
  }
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        user_id: userId,
        target_id: targetId,
        target_type: targetType,
        rating,
        content
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error submitting review:', error);
    throw new Error(error.message);
  }

  return data;
}
