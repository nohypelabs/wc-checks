# Changelog

All notable changes to WC-Checks will be documented in this file.

## [4.0.4] - 2026-06-03

### 🔧 UI Polish & Dark Glass Consistency

#### Dashboard Header & Footer
- **Header**: Hamburger icon replaced with Prenacons logo (tap to open sidebar)
- **Header**: Removed logo images, center text only ("Proservice Indonesia")
- **Footer**: Minimal bar style — left: copyright + year, right: "Developed by NoHypeLabs · v4.0.3"
- **Footer**: Single `border-t` separator, no card/glass wrapper

#### Sidebar
- **Logout button**: Moved to top-right of sidebar header, replaces X close button
- **Logout styling**: Hover turns red (`hover:bg-red-500/20`), icon transitions to `text-red-300`
- **Bottom logout section**: Removed entirely
- **Close behavior**: Overlay click or swipe to close (no X button)

#### Profile Page
- **Logout button**: Removed from profile page (now only in sidebar)
- **Info fields**: Added glassmorphism (`backdrop-blur-md border-white/10`) to Email, Phone, Jabatan, Bergabung Sejak, Login Terakhir
- **Role badges**: Converted to dark glass — Administrator (`bg-purple-500/15 border-purple-400/25`), Pengguna (`bg-blue-500/15`), Aktif (`bg-green-500/15`), Tidak Aktif (`bg-red-500/15`)

#### InspectionDetailModal
- **Close button**: Repositioned to `top-2 right-2` with `z-30` — no longer overlaps score badge
- **Button style**: Glass background (`bg-white/10 backdrop-blur-sm border-white/10`)

#### Success & Failed Modals
- **Icon circles**: `bg-white` solid → `bg-white/15 backdrop-blur-sm border-white/20`
- **SuccessModal**: CheckCircle `text-green-500` → `text-green-300`
- **FailedModal**: Error text `text-red-800` → `text-red-200`, tips `text-blue-900` → `text-blue-200`
- **FailedModal**: Box borders updated to `border-{color}-400/25`

---

## [4.0.3] - 2026-06-03

### 📊 Dashboard - Inspection Trend Chart

#### New Feature
- **Crypto-style area chart**: 30-day inspection trend displayed at the top of the dashboard, above stat cards
- **Smooth area chart** via `recharts` with gradient fill — looks like a crypto portfolio chart
- **Smart color coding**: Green (growth ↑), Red (decline ↓), Blue (neutral)
- **Glass morphism card**: `bg-white/8 backdrop-blur-xl` wrapper matching dashboard theme
- **Custom tooltip**: Shows inspection count + full Indonesian date on hover
- **Trend badge**: Percentage change indicator with matching color
- **Period selector**: Toggle between 7D, 30D, 90D with glass pill buttons

#### Backend
- **`/api/stats`**: Added `dailyTrend` field — array of `{ date, count }` for configurable period
- **`/api/stats?days=N`**: Supports `?days=7`, `?days=30`, `?days=90` query param
- **New Supabase query**: Groups inspection records by date, fills gaps with zero counts
- **`useInspectionTrend` hook**: New hook for independent trend data fetching

#### Dependencies
- Added `recharts` v3.8.1

---

## [4.0.2] - 2026-06-03

### ✨ InspectionDetailModal - Glassmorphism & Icon Cleanup

#### Header Redesign
- **Score-based glassmorphism**: Header background uses translucent glass with score-based colors (green ≥90, blue ≥75, yellow ≥60, red <60)
- **Glass score badge**: Replaced solid white (`bg-white/95`) badge with matching glass style (`bg-{color}-500/25 backdrop-blur-xl`)
- **Decorative glass circles**: Added subtle blurred circles for depth effect
- **Consistent border**: `border-b border-{color}-400/20` matches header tint

#### Emoji → Lucide Icons (All Replaced)
- **Toilet icon**: 🚽 → `<Toilet />` (header location)
- **Building icon**: 🏢 → `<Building2 />` (organization name)
- **Occupation icon**: `{emoji from DB}` → `<Briefcase />` (inspector role)
- **Component icons**: `<span>{text}</span>` → Dynamic Lucide lookup via `(Icons as any)[iconName]`
- **Choice indicators**: ✅⚠️❌🌸💩 → `<CheckCircle2>` / `<AlertTriangle>` / `<XCircle>` with per-choice colors
- **Section headers**: 📋 → `<ClipboardList />`, 🔧 → `<Wrench />`, 💬 → `<MessageSquare />`
- **Unavailable**: ⏭️ → `<SkipForward />`

#### Bug Fixes
- **Issues section**: Fixed light background (`bg-orange-50`) to dark glass style (`bg-orange-500/15`)
- **Unused imports**: Cleaned up `Star`, `ThumbsUp`, `ThumbsDown`, `Minus`, `HOVER_TRANSITION`

---

## [4.0.1] - 2026-06-03

### 🎨 UI/UX Overhaul - Dark Navy Theme

#### Complete Theme Redesign
- **Dark Navy Background**: Applied `from-slate-900 via-slate-800 to-slate-900` gradient across ALL pages
- **Glassmorphism Cards**: All cards now use `bg-white/8 backdrop-blur-md border-white/10` glass effect
- **Consistent Text Colors**: All `text-gray-*` replaced with `text-white` with proper opacity levels
- **No More Light Backgrounds**: Removed all `bg-white`, `bg-gray-*`, `bg-blue-50`, etc.

#### Components Fixed (23+ files)
- **UI Components**: Card, Input, StatCard, Badge, Button, ActionButton, Skeleton, LoadingSpinner
- **Admin Pages**: AdminDashboard, LocationsManager, BuildingsManager, OrganizationsManager, OccupationManager, TemplatesManager, QRCodeGenerator
- **User Pages**: Dashboard, ScanPage, ReportsPage, AnalyticsPage, LocationsListPage, AddLocationPage, ProfilePage, SettingsPage, HelpPage, AboutPage
- **Auth Pages**: LoginPage, RegisterPage (converted from light to dark theme)
- **Forms**: ComprehensiveInspectionForm, RatingSelector, LocationForm, InspectionSuccessModal, InspectionFailedModal
- **Layout**: Sidebar (mobile & desktop), BottomNav, Navbar
- **Other**: PWAInstallPrompt, DebugPanel, CalendarView, InspectionDetailModal, InspectionDrawer, PhotoReviewModal

#### Inspection Form Improvements
- **Compact Layout**: Removed camera button, reduced padding/margins
- **Removed "Lainnya" (Other) button**: Simplified rating to 3 choices only
- **Removed per-component photo upload**: Cleaner component cards
- **Lucide Icons**: Replaced ALL emojis with Lucide React icons
- **Renamed "bau-bauan" to "Aroma"**: More formal terminology
- **Aroma icon**: Changed to Flower2 for better visual representation

#### Search Bars & Inputs
- **All search bars**: Converted to dark glass style (`bg-slate-800/80`)
- **Building filter**: Custom dropdown with dark glass styling
- **Admin search bars**: Buildings, Organizations, Locations all updated
- **Login/Register inputs**: White text with dark backgrounds

#### Header & Navigation
- **Header height**: Increased 30% on ALL pages (`py-5`)
- **Proservice Indonesia**: Text and logo size increased 30%
- **QR Scanner button**: Modern cyan-blue gradient
- **BottomNav**: Dark glass background

#### Other Improvements
- **Update Notification**: Elegant modal showing for 1 week after update
- **Version**: Updated to 4.0.1 across app
- **Building filter dropdown**: Custom implementation with Building2 icons
- **Export menu**: Dark glass styling with colored icon containers

---

## [3.0.0] - Previous Release

- Initial release with blue gradient theme
- Basic inspection functionality
- Admin dashboard
- QR code scanning
