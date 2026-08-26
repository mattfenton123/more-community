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
- **Frontend**: React 19, Vite, React Router DOM
- **UI Components**: Lucide React for iconography, Vanilla CSS for styling (per strict design requirements)
- **Mapping**: Leaflet & React-Leaflet
- **Backend & Database**: Supabase (PostgreSQL, GoTrue Auth, Realtime, Storage)

## Setup & Local Development

1. **Install Dependencies**
   Navigate to the `app/` directory and run:
   ```bash
   npm install
   ```

2. **Database Seeding (Optional but Recommended)**
   If you want to view the app populated with rich mock data, run the seeder script:
   ```bash
   node seedFullData.js
   ```
   *Note: This script will populate the database with users, communities, and events using the credentials found in your environment or the script itself.*

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

4. **Production Build**
   To create an exportable, production-ready build:
   ```bash
   npm run build
   ```
   The output will be generated in the `app/dist/` directory, which can be deployed to Vercel, Netlify, or any static hosting provider.

## Next Iterations
- **Advanced Analytics**: Implement time-series data tracking for member engagement and event attendance.
- **Notifications Engine**: Wire up the existing `notifications` table to push real-time browser alerts.
- **In-App Messaging**: Expand the existing basic `Chat.jsx` to support threading and rich media reactions.
