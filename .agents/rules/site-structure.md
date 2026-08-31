# Site Structure Governance

The `more-community` codebase is in the middle of a migration to Next.js App Router.

**CRITICAL RULE**: The ACTIVE site deployed on Vercel is driven by the Next.js App Router located in `app/app/`. 
Do NOT modify files in `app/src/views/` expecting them to show up on the live site. The files in `app/src/views/` are legacy from the original Vite React SPA. 

However, shared components in `app/src/components/` and context files in `app/src/context/` ARE actively used by the Next.js pages. When creating new UI or features, modify the `app/app/` route files and create/modify components in `app/src/components/`.
