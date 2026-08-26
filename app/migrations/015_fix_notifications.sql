-- Migration 015: Fix Notifications Table Schema
-- Run this in the Supabase SQL Editor

-- 1. Rename columns to match the application's expected names
ALTER TABLE public.notifications 
  RENAME COLUMN read TO is_read;

ALTER TABLE public.notifications 
  RENAME COLUMN body TO message;

-- 2. Make the 'type' column nullable, as broadcasts don't always provide a type
ALTER TABLE public.notifications 
  ALTER COLUMN type DROP NOT NULL;
