# Welcome to your Lovable project

## Project info

**URL**: https://habits-planet.pages.dev/

# Habit Planet

Habit Planet is a visual habit tracker where daily progress grows a 3D planet. Create habits, mark them complete, build streaks, and unlock planet objects at milestone streaks.

## Features

- Create and organize habits by type.
- Track daily completions and current streaks.
- Grow a 3D planet as habits are completed.
- Simulate future streaks in the development panel.
- Sign in with Supabase to sync habits across sessions.
- Start over with a local reset or clear local data when signing out.

## Tech stack

- React and TypeScript
- Vite
- Tailwind CSS and shadcn/ui
- React Three Fiber and Three.js
- Supabase authentication and database
- Vitest

## Getting started

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

The development server runs at the URL shown by Vite, usually `http://localhost:8080`.

## Environment variables

Create a `.env` file in the project root:

```dotenv
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

Apply the SQL migrations in `supabase/migrations` to the connected Supabase project.

## Scripts

```sh
npm run dev       # Start the development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm test          # Run the test suite
```

## Deployment

This project can be deployed through Lovable. Push the latest changes to the connected repository, then open the Lovable project and choose **Share → Publish**.

