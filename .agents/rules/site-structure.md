# Site Structure: Vite React SPA vs Next.js

**CRITICAL WARNING:** This repository contains two parallel frontend implementations. You MUST modify the correct one.

## The Active App (Vite React SPA)
The frontend that the user is actively running locally (`localhost:3000`) and deploying to Vercel is a **React Single Page Application**. 
- It uses React Router (`react-router-dom`).
- All active application code is located in: `app/src/`
- Views/Pages are located in: `app/src/views/` (e.g., `app/src/views/CommunityProfile.jsx`, `app/src/views/HomeFeed.jsx`)
- Components are located in: `app/src/components/`
- Contexts are located in: `app/src/context/`

**Any feature requests, UI changes, or logic updates must be made in `app/src/views/` and `app/src/components/`.**

## The Inactive / Legacy App (Next.js)
There is an unused or abandoned Next.js App Router structure in this repository.
- Location: `app/app/` (e.g., `app/app/community/[id]/client-page.jsx`)
- **DO NOT MODIFY FILES IN `app/app/`** unless explicitly instructed to work on the Next.js migration. These files are not rendered in the user's active environment.

## Summary Checklist
Before modifying a file, ask yourself:
1. Is this file in `app/src/views/`? -> **YES**, proceed.
2. Is this file in `app/app/`? -> **NO**, this is the wrong file. Use the equivalent file in `app/src/views/` instead.
