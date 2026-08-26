-- Migration 013: Features Expansion (PWA, Monetisation, QR Check-ins, CRM)
-- Run this in the Supabase SQL Editor

-- Add subscription_price to communities for paid memberships
ALTER TABLE communities ADD COLUMN IF NOT EXISTS subscription_price DECIMAL(10,2) DEFAULT 0;

-- Add ticket_price to events for paid ticketing
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(10,2) DEFAULT 0;

-- Add checked_in boolean to event_rsvps for QR check-in tracking
ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;

-- Add verified column to communities if not exists (for admin dashboard)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
