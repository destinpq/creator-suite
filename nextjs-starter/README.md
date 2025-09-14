Next.js starter scaffold moved out of the main frontend to avoid TypeScript scanning conflicts.

This folder contains a minimal Next.js starter for migration planning.

Files included:
- package.json
- tsconfig.json
- styles/globals.css
- pages/_app.tsx
- pages/index.tsx

Move notes:
- This directory is intentionally placed at the repository root to keep the main frontend's TypeScript build unaffected.
