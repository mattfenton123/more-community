-- Migration 016: Fix Notifications Schema
-- Run this in the Supabase SQL Editor

-- The 007 migration used CREATE TABLE IF NOT EXISTS for notifications, which failed to update the columns 
-- if the table was already created by 002. This migration forcefully renames the columns.

DO $$
BEGIN
    -- Rename 'read' to 'is_read' if 'read' exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='read') THEN
        ALTER TABLE public.notifications RENAME COLUMN "read" TO is_read;
    END IF;

    -- Rename 'body' to 'message' if 'body' exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='body') THEN
        ALTER TABLE public.notifications RENAME COLUMN body TO message;
    END IF;
END $$;
