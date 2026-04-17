# Changelog

All notable changes to WC-Checks will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-04-17

### ✨ UI/UX — Kompaksi Layout & Navigasi

#### Changed

- **InspectionDetailModal — Layout lebih compact (less scrolling)**
  - Header: padding `p-6` → `p-4`, icon toilet `w-16` → `w-11`, judul `text-2xl` → `text-lg`
  - Score badge dipindah **inline** ke kanan header (bukan baris terpisah), hemat ~40px vertikal
  - Metadata cards (Tanggal & Inspektur): selalu 2 kolom, padding `p-4` → `p-2.5`, icon `w-10` → `w-7`
  - Email inspektur disembunyikan bila occupation tersedia (info duplikat)
  - Component rating rows: card `p-4 rounded-xl border-2` → slim row `px-3 py-2 rounded-lg border`
  - Section spacing: `space-y-6` → `space-y-3`; foto grid: `2-3 cols gap-3` → `3-4 cols gap-2`
  - Issues & Maintenance: `p-4 border-2 rounded-xl` → `px-3 py-2 border rounded-lg`
  - Bottom spacer: `h-16` → `h-2`; modal height: `max-h-[80vh]` → `max-h-[94vh]`
  - File: `src/components/reports/InspectionDetailModal.tsx` (commit `615fae9`)

- **ReportsPage — 3 export button digabung jadi 1 dropdown**
  - Sebelum: button Export PDF (merah), Data Saya (hijau), Semua Pengguna (biru) — stack vertikal di mobile
  - Sesudah: 1 button `Export ▾` → dropdown berisi semua opsi
  - Dropdown tutup otomatis on outside click (`useEffect` + `useRef`)
  - Chevron rotate 180° saat dropdown terbuka
  - Disabled state tetap terjaga (`totalInspections === 0`)
  - Opsi "Semua Pengguna" tetap hanya muncul untuk admin
  - File: `src/pages/ReportsPage.tsx` (commit `2fa6a78`)

> **Status:** Committed, belum dipush — menunggu sign-off client.

---

## [3.0.0] - 2025-12-01

### 🎉 Major Release - Enterprise Features & Performance

#### Added
- **Backend API Complete**: 13 endpoints with full authentication
  - `/api/auth/verify-role` - Server-side role verification
  - `/api/admin/*` - Admin management endpoints
  - `/api/reports` - Inspection reports with organization/building data
  - `/api/inspections` - Inspection CRUD operations
- **Audit Logging System**: Track all admin actions for compliance
  - SQL table `audit_logs` with RPC function
  - Frontend hooks `useAuditLogs()`, `useRecentAdminActions()`
- **Graceful Fallback Mechanism**: Admin access never breaks
  - Backend API primary, direct DB query as fallback
  - Automatic recovery when backend issues resolved
- **Enhanced Role Management**:
  - Superadmin (level 100) - Full access
  - Admin (level 80-99) - Admin pages
  - User (level 0-79) - Regular access
- **Sidebar Navigation Animations**:
  - Spring-based hover/tap animations
  - Ripple effects on click
  - Active indicator with smooth morphing
  - Stagger entrance animations
- **Inspection Detail Modal Enhancement**:
  - Display organization name
  - Display building name with fallback
  - Nested data joins for complete information

#### Changed
- **Performance Optimizations**:
  - `useIsAdmin` staleTime: 5min → 30min (role changes are rare)
  - Added gcTime: 60 minutes for React Query
  - Reduced retry attempts: 2 → 1 (faster failures)
  - Disabled refetchOnWindowFocus for admin checks
  - Backend middleware: 2 DB queries → 1 optimized query (50% reduction)
  - Edge caching: 15-minute cache on `/api/auth/verify-role`
- **Loading Performance**:
  - First load: ~1500-2000ms → ~800-1200ms (40-60% faster)
  - Subsequent loads: ~500-1000ms → ~0-50ms (95% faster with cache)
- **Sidebar Animation Tuning**:
  - Collapse/expand duration: ~300ms → ~450ms (more visible)
  - Adjusted spring physics: stiffness 200→180, damping 30→26

#### Fixed
- **Database Schema**: Changed `organizations.code` to `short_code`
- **Type Safety**: Fixed InspectionReport interface with organization/building types
- **Console Logging**: Removed excessive log statements (performance)
- **TypeScript Errors**: Fixed Sidebar.tsx closing tag mismatch
- **Unused Imports**: Cleaned up unused variables and imports

#### Security
- **100% Backend Enforcement**: All role checks through backend API
- **No Frontend Bypass**: Server-side validation for all admin operations
- **Audit Trail**: Complete logging of sensitive operations
- **Self-Protection**: Cannot modify own role or deactivate self

---

## [2.5.0] - 2025-11-05

### 🔐 Security & Reliability Release

#### Added
- **Backend API for Role Management**:
  - Vercel Serverless Functions for critical operations
  - Role assignment API with validation
  - User status toggle API
  - Server-side authentication middleware
- **Fallback Role Verification**: Graceful degradation when backend unavailable
- **Health Check Endpoint**: `/api/health` for monitoring
- **Debug Tools**:
  - `debug-admin-access.js` script for self-service debugging
  - Enhanced error logging

#### Changed
- **Authentication Architecture**:
  - Moved from direct Supabase queries to backend API
  - Implemented `validateAuth` middleware with SERVICE_KEY
  - Added role hierarchy enforcement (level-based)
- **Environment Variables**:
  - Added `SUPABASE_SERVICE_KEY` for backend operations
  - Separated frontend and backend Supabase configs

#### Fixed
- **Admin Page Blocking Issue**: Consistent role verification
- **RLS Policy Conflicts**: Backend bypasses RLS with SERVICE_KEY
- **Inconsistent Role Checks**: Single source of truth architecture

---

## [2.0.0] - 2025-10-15

### 🚀 PWA & Mobile Optimization

#### Added
- **Progressive Web App (PWA)** support:
  - Installable on mobile devices
  - Offline capability (service worker)
  - App manifest with icons
  - PWA install prompt component
- **Mobile-First UI**:
  - Bottom navigation for mobile
  - Responsive sidebar for desktop
  - Touch-optimized buttons
  - Haptic feedback on interactions
- **QR Code Features**:
  - Bulk QR code generation (admin)
  - Download QR codes as ZIP
  - Print QR codes (PDF)
- **Photo Management**:
  - Image compression before upload (1MB max)
  - Cloudinary integration
  - Photo gallery in reports
  - Thumbnail previews

#### Changed
- **Build System**: Upgraded to Vite 5.4
- **React**: Upgraded to 18.2 with concurrent features
- **Routing**: Migrated to React Router 6.26
- **Styling**: Enhanced Tailwind CSS config
- **Forms**: Migrated to React Hook Form + Zod validation

#### Fixed
- **Mobile Safari**: Fixed viewport height issues
- **Touch Events**: Improved touch target sizes
- **Image Rotation**: Auto-correct photo orientation
- **Network Offline**: Graceful degradation when offline

---

## [1.5.0] - 2025-09-01

### 📊 Reports & Analytics

#### Added
- **Reports Page**:
  - Monthly calendar view
  - Daily inspection list
  - Inspection detail modal
  - Filter by building/organization
- **Analytics Dashboard**:
  - Inspection trends (7, 14, 30 days)
  - Average scores by location
  - Completion rates
  - User activity stats
- **PDF Export**:
  - Generate PDF reports
  - Include photos and notes
  - Multi-page support
- **Excel Export**:
  - Export inspection data to XLSX
  - Customizable columns
  - Date range filtering

#### Changed
- **Date Handling**: Migrated to `date-fns` (lighter than Moment.js)
- **Charts**: Added lightweight charting (no heavy libraries)

---

## [1.0.0] - 2025-08-01

### 🎊 Initial Release

#### Added
- **Core Features**:
  - User authentication (Supabase Auth)
  - QR code scanning (camera + upload)
  - Inspection form (cleanliness, supplies, maintenance)
  - Photo upload (multiple photos per inspection)
  - Dashboard (inspection history)
- **Admin Features**:
  - Organization management (CRUD)
  - Building management (CRUD)
  - Location management (CRUD)
  - User role assignment
- **Database**:
  - PostgreSQL (Supabase)
  - Row Level Security (RLS) policies
  - Database indexes for performance
  - Comprehensive schema (15+ tables)
- **Tech Stack**:
  - React 18 + TypeScript
  - Vite build tool
  - Tailwind CSS
  - React Query (server state)
  - Supabase (backend)
  - Cloudinary (image hosting)
- **Deployment**:
  - Vercel hosting
  - Serverless functions (API routes)
  - Edge caching
  - Automatic CI/CD

---

## Version Naming Convention

- **Major (X.0.0)**: Breaking changes, major rewrites, new architecture
- **Minor (x.X.0)**: New features, non-breaking improvements
- **Patch (x.x.X)**: Bug fixes, small improvements, security patches

---

## Upgrade Guide

### From 2.x to 3.0

**Breaking Changes:**
- None (backward compatible)

**Recommended Actions:**
1. Update environment variables in Vercel:
   - Add `SUPABASE_SERVICE_KEY` for backend operations
2. Run database migrations:
   - `supabase/migrations/20250128_rls_policies.sql`
   - `supabase/migrations/20250128_database_indexes.sql`
3. Clear browser cache for users (new bundle)

### From 1.x to 2.0

**Breaking Changes:**
- React Router upgraded from v5 to v6 (different API)
- Forms now use React Hook Form (different validation)

**Migration Steps:**
1. Update route syntax: `<Route path="/dashboard" component={Dashboard} />` → `<Route path="/dashboard" element={<Dashboard />} />`
2. Update form validation to use Zod schemas
3. Install PWA manifest on mobile devices

---

## Upcoming Features (Roadmap)

### v3.1.0 (Q1 2025)
- [ ] Real-time notifications (Supabase Realtime)
- [ ] Multi-language support (i18n)
- [ ] Dark mode toggle
- [ ] Advanced filters (multi-select, date ranges)

### v3.2.0 (Q2 2025)
- [ ] Scheduled inspections (recurring tasks)
- [ ] Email notifications (inspection reminders)
- [ ] Custom inspection templates (admin-defined)
- [ ] Bulk inspection import (CSV/Excel)

### v4.0.0 (Q3 2025)
- [ ] Mobile app (React Native)
- [ ] Offline-first architecture (local SQLite)
- [ ] Advanced analytics (ML-based insights)
- [ ] API for third-party integrations

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- How to propose new features
- How to report bugs
- Pull request process
- Code style guidelines

---

## Support

For issues, questions, or feature requests:
- **GitHub Issues**: [github.com/your-org/wc-checks/issues](https://github.com/your-org/wc-checks/issues)
- **Email**: support@yourcompany.com
- **Slack**: #wc-checks-support

---

**Last Updated:** 2025-12-01
**Maintained By:** Development Team
