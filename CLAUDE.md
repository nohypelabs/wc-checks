# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (frontend only, port 5174)
pnpm dev

# Development with API routes (recommended, port 3000)
vercel dev

# Type check
pnpm type-check

# Lint
pnpm lint

# Build for production
pnpm build

# Tests (watch mode)
pnpm test

# Tests (single run, for CI)
pnpm test:run

# Single test file
pnpm test src/lib/utils.test.ts

# Coverage
pnpm test:coverage
```

## Architecture

**WC-Checks** is a toilet inspection management app. React 18 + TypeScript SPA built with Vite, Vercel serverless functions for the backend API, and Supabase (PostgreSQL + auth) as the database.

### Key Layer Separation

```
Pages → Custom Hooks → Backend API (/api/*) → Supabase (service key)
                     ↘ Supabase client (anon key, read-only / RLS-protected)
```

- **Frontend** never uses the Supabase service key — only the anon key with RLS.
- **Backend API** (`/api/`) uses the service key and validates every request through `api/middleware/role-guard.ts` (`validateAuth(req, minLevel)`).
- **Role levels:** user = 0, admin ≥ 80, super admin = 100. All admin routes enforce `minLevel` server-side.

### State Management

Server state lives in TanStack Query (global `staleTime: 0` — always considered stale for real-time feel). Individual hooks override this (e.g., `useInspections` uses 30s, `useIsAdmin` uses 30min). `gcTime` is 5 minutes globally. Data is persisted to localStorage via `createSyncStoragePersister`. Zustand is available (`^5.0.8`) but only used sparingly — server data goes through TanStack Query, not Zustand stores. Local UI state uses `useState`/`useReducer`. Auth state comes from `useAuth` (wraps Supabase auth listener with PKCE flow, session in localStorage).

### Routing

The root route `/` renders `AdminDashboard` directly — it handles role-based content display internally (no separate user/admin dashboards). All pages are `React.lazy`-loaded except `LoginPage` and `RegisterPage`. Named exports are re-mapped to `default` in the lazy import (`.then(m => ({ default: m.ComponentName }))`). Route guards:
1. Auth check (`user` from `useAuth`)
2. Admin pages rely on `useIsAdmin()` which hits `/api/auth/verify-role`

### Custom Hooks (`src/hooks/`)

Each hook corresponds to a backend API endpoint. Role-sensitive hooks (`useIsAdmin`, `useAdminInspections`, `useUserRoles`, etc.) always call the backend API with a Bearer token — never query Supabase directly for privileged data.

### Backend API (`/api/`)

Vercel serverless functions. Standard handler pattern:
1. Call `validateAuth(req, minLevel)` to decode JWT, verify user, and check role level
2. Perform the operation using the service-key Supabase client
3. Call `createAuditLog()` (tries RPC `create_audit_log` first, falls back to direct insert)

Helper functions `errorResponse()` and `successResponse()` in `role-guard.ts` format standard JSON responses with timestamps.

### Supabase Client (`src/lib/supabase.ts`)

Exports a typed `db` helper object (`db.users`, `db.buildings`, `db.locations`, `db.inspectionRecords`, `db.inspectionTemplates`, `db.photos`) that wraps common queries with logging and retry logic. Connection test is opt-in (`initializeConnection()`) — it does not auto-run on import.

### Path Alias

Vitest configures `@` → `./src` for test imports. **tsconfig.json does not have this alias** — use relative imports (`../lib/supabase`) in source code, `@/lib/supabase` only in tests.

### Forms

Forms use React Hook Form 7 with Zod schemas for validation (via `@hookform/resolvers/zod`). Zod schemas define both form validation and runtime type inference.

### Image Handling

Photos are compressed client-side via `browser-image-compression` (max 1 MB) before upload to Cloudinary. The Cloudinary cloud name and upload preset come from `VITE_CLOUDINARY_*` env vars.

### QR Codes & PDF

QR scanning uses `html5-qrcode`. QR generation uses `qrcode` (data URLs) and `qrcode.react` (React components). PDF reports are generated client-side with `jspdf` + `jspdf-autotable`.

### Build

Vite splits vendor chunks explicitly (react, router, supabase, query, lucide, framer-motion, jspdf, qr) plus page-level chunks (admin, reports, inspection). PWA/service worker is intentionally **disabled** (unregistered on startup in `main.tsx`). Console statements are dropped in production (`drop_console: mode === 'production'`).

### Testing

Vitest with jsdom environment. Test setup (`src/test/setup.ts`) mocks `window.matchMedia`, `IntersectionObserver`, and `navigator.vibrate`. Coverage uses v8 provider. React Testing Library + user-event for component tests.

## Environment Variables

```env
# Frontend (Vite — must be prefixed VITE_)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_CLOUDINARY_FOLDER=

# Backend API only (Vercel serverless — no VITE_ prefix)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

## Multi-Tenant Architecture (Organization Scoping)

The system uses multi-tenant isolation via organizations. Each tenant (DKI, ABN01, PTPN, GDG01) is an organization. Data is isolated per org via RLS.

### Data Model

```
organizations (tenants)
├── buildings (physical buildings, optional)
│   └── locations (toilet/inspection areas)
│       └── inspection_records
└── users (staff per org)
```

### User Approval Flow

New registrations default to `approval_status = 'pending'`. Superadmin assigns organization + sets approval to `approved` from `/superadmin/users`.

| Status | Access |
|--------|--------|
| `pending` | Login only, see own profile |
| `approved` | Full access (scoped to org if assigned) |
| `rejected` | Blocked |

### RLS Strategy

- **Users with org:** see only their org's data
- **Users without org (approved):** see all data (backward compatible)
- **Pending users:** see only own profile
- **Backend API (service role):** full access, bypasses RLS
- **Superadmin:** manages all users/roles from `/superadmin/users`

Helper function `get_user_org_id()` uses `SECURITY DEFINER` to avoid infinite recursion between RLS policies.

### Key Migrations

- `20260609_01` through `20260609_06` — organization scoping, RLS, approval flow
- `20260609_rollback.sql` — undo all migrations

Full documentation: `docs/ORGANIZATION_SCOPING.md`

## Database Migrations

Migrations live in `supabase/migrations/`. Apply them manually in the Supabase SQL editor. The numbered migrations (`20250128_*.sql`) are the canonical ones; the uppercase SQL files are one-off diagnostic/fix scripts and are not part of the migration sequence.

## Generated Types

`src/types/database.types.ts` contains Supabase-generated database types. Both frontend (`src/lib/supabase.ts`) and backend (`api/middleware/role-guard.ts`) import these types for type-safe queries.
