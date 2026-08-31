# Architecture and Routing Rules

This project has migrated to the Next.js App Router.

- **Use `app/app/` for all pages and routes.**
- **DO NOT modify files in `app/src/views/` for routing or page UI.** They are legacy React components left over from before the Next.js migration and are mostly dead code.
- Always check the `app/app/` directory first for active pages, layouts, and components.
- Contexts (`app/src/context/`) and generic UI components (`app/src/components/`) are still shared and valid to edit, but actual page views must be edited in the Next.js App Router directory.
