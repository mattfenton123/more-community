"use server";

import { supabaseAdmin as supabase } from '../lib/supabaseAdmin.js';

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
