# Development Guide

## Running the Application Locally

This application uses **Vercel** for both frontend (Vite + React) and backend (API serverless functions).

### Prerequisites

1. Node.js (v18 or higher)
2. Vercel CLI (installed globally)
3. Supabase credentials in `.env` file

### Setup

```bash
# Install dependencies
npm install

# Install Vercel CLI (if not already installed)
npm install -g vercel

# Create .env file with Supabase credentials
cp .env.example .env  # then edit .env with your credentials
```

### Running the Dev Server

#### Method 1: With Backend API (Recommended) 🚀

```bash
# Start with Vercel (runs both frontend + backend)
vercel dev
```

This will:
- ✅ Run Vite dev server (frontend)
- ✅ Execute API routes (backend serverless functions)
- ✅ Properly handle `/api/*` requests

**Access the app at:** `http://localhost:3000` (Vercel's default port)

#### Method 2: Frontend Only (For UI Development)

```bash
# Start frontend only (no API)
npm run dev
```

⚠️ **Warning:** API requests will fail when using `npm run dev` because the backend API routes won't be running. Only use this if you're working on UI components that don't need API calls.

## API Routes

All API routes are located in the `/api` directory and are implemented as Vercel Serverless Functions:

```
/api
  /admin
    - organizations.ts    (CRUD for organizations)
    - buildings.ts        (CRUD for buildings)
    - locations.ts        (CRUD for locations)
    - list-users.ts       (List all users)
    - list-roles.ts       (List all roles)
    - assign-role.ts      (Assign role to user)
    - toggle-user-status.ts (Activate/deactivate user)
  /auth
    - verify-role.ts      (Verify user's role/permissions)
  /middleware
    - role-guard.ts       (Authentication & authorization)
```

## Common Issues

### Issue: "Non-JSON response" errors
**Cause:** Running `vite` instead of `vercel dev`
**Solution:** Use `npm run dev` (not `npm run dev:vite`)

### Issue: API returns TypeScript source code
**Cause:** API routes not being executed (Vite can't run serverless functions)
**Solution:** Make sure you're using `vercel dev`

### Issue: "No authentication token" errors
**Cause:** Missing or invalid Supabase credentials
**Solution:** Check your `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Deployment

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## Tech Stack

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Backend:** Vercel Serverless Functions (TypeScript)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **State Management:** React Query + Zustand
- **Authentication:** Supabase Auth

## Project Structure

```
/src                    # Frontend React app
  /components          # React components
  /pages              # Page components
  /hooks              # Custom React hooks (API calls)
  /lib                # Utilities
  /types              # TypeScript types

/api                   # Backend API routes (Vercel functions)
  /admin              # Admin-only endpoints
  /auth               # Authentication endpoints
  /middleware         # Shared middleware

/public               # Static assets
```
