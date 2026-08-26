-- ============================================================
-- Migration 006: Event Management Evolution
-- Adds description, status, and max_capacity to events
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Event description for richer event details
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description text;

-- 2. Event status: draft, published, cancelled
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';

-- 3. Optional capacity limit
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_capacity integer;
