# More Community MVP

This project is a fully functional MVP for the More Community platform. It enables community leaders to create and manage their groups, host events, and engage with members. Users can easily discover trending groups, parkruns, and local activities through an interactive map and rich search experience.

## Features Included in the MVP
- **Rich Community Discovery**: A responsive `Discover` view featuring local groups, parkruns, and activities filtered by tags (e.g., Wellness, Adventure, Running) and full-text search.
- **Interactive MapView**: An integrated map using Leaflet that accurately plots communities using actual latitude and longitude coordinates.
- **Leader Dashboard**: A comprehensive management interface for community leaders. It calculates dynamic analytics (Total Members, Active Events) and provides tools to create events, manage memberships, and send broadcasts.
- **Direct Image Uploads**: Refactored to upload cover images directly to Supabase Storage, removing complex serverless dependencies for easier local development.
- **Comprehensive Seed Data**: Includes a `seedFullData.js` script that provisions the database with realistic communities (e.g., Tunbridge Wells Parkrun, Kent Adventures) using high-quality Unsplash imagery.
- **Authentication**: Email/password and OAuth support out of the box via Supabase, guarded by an `AuthGate` component.

## Tech Stack
- **Frontend & Routing**: Next.js 15 (App Router), React 19
- **UI Components & Design**: Lucide React for iconography, Vanilla CSS Design System with dark glassmorphic styling
- **Mapping**: Leaflet & React-Leaflet with dynamic coordinates
- **Backend & Database**: Supabase (PostgreSQL, GoTrue Auth, Realtime, Storage) via Next.js Server Actions with Service Role verification
- **Integrations**: Web Push notifications, AI Event Drafting, WhatsApp community bridges

## Setup & Local Development

1. **Install Dependencies**
   Navigate to the `app/` directory and run:
   ```bash
   npm install
   ```

2. **Database Seeding (Optional but Recommended)**
   To seed communities, users, and events:
   ```bash
   node seedFullData.js
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:3000`.

4. **Production Build**
   To verify and generate an optimized production build:
   ```bash
   npm run build
   ```

## Key Completed Features
- **Community Management & Safeguarded Deletion**: Leaders can rename and customize full details, with strict name-confirmation and cascade cleanup on delete.
- **Segmented Onboarding**: Category-segmented tag library (60+ tags across 5 focus areas) with instant search and custom tag creation.
- **Server Action Security**: Server-side role verification (Leader/Co-Leader/Admin) on all mutations (community updates, event editing, member management, posts).
- **Interactive Discovery & Maps**: Real-time category filtering, map view, and event calendars.
