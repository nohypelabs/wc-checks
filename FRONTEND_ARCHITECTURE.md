# Frontend Architecture - WC-Checks

**Version:** 3.0.0
**Framework:** React 18 + TypeScript + Vite
**Last Updated:** 2025-12-01

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [State Management](#state-management)
- [Custom Hooks](#custom-hooks)
- [Components Architecture](#components-architecture)
- [Routing Strategy](#routing-strategy)
- [Performance Optimizations](#performance-optimizations)
- [Best Practices](#best-practices)

---

## 🎯 Overview

WC-Checks frontend is a **Progressive Web App (PWA)** built with modern React patterns:

- **Component-based architecture** with functional components
- **React Query** for server state management
- **TypeScript** for type safety
- **Lazy loading** for optimal bundle size
- **Framer Motion** for smooth animations
- **Mobile-first responsive design**

### Architecture Principles:

```
┌─────────────────────────────────────────┐
│         Component Layer (UI)            │
│   Pages → Layout → Components → UI     │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│        Custom Hooks Layer               │
│   useAuth, useReports, useIsAdmin, etc. │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│       Service Layer (API Calls)         │
│   Backend API + Supabase Client         │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Backend (Vercel Functions)      │
│   /api/auth, /api/admin, /api/reports   │
└─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Core Libraries:

| Library | Version | Purpose |
|---------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **TypeScript** | 5.9.3 | Type safety |
| **Vite** | 5.4.11 | Build tool + dev server |
| **React Router** | 6.26.0 | Client-side routing |
| **TanStack Query** | 5.17.0 | Server state management |
| **Framer Motion** | 12.23.24 | Animations |
| **Tailwind CSS** | 3.4.18 | Styling |
| **Supabase** | 2.76.1 | Auth + Database client |

### UI & Forms:

- **lucide-react** - Icon library
- **react-hook-form** - Form management
- **zod** - Schema validation
- **sonner** - Toast notifications

### Features:

- **html5-qrcode** - QR code scanning
- **qrcode.react** - QR code generation
- **jspdf** + **jspdf-autotable** - PDF export
- **browser-image-compression** - Image optimization
- **cloudinary-react** - Image upload/hosting

---

## 📁 Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # Base UI components (Button, Input, Card)
│   ├── layout/             # Layout components (Sidebar, MainLayout)
│   ├── forms/              # Form components (InspectionForm, LocationForm)
│   ├── reports/            # Report components (Calendar, DetailModal)
│   ├── admin/              # Admin-specific components (AdminCard, AdminRoute)
│   ├── mobile/             # Mobile components (BottomNav, Navbar)
│   ├── common/             # Shared components (PWAInstallPrompt)
│   └── animations/         # Animation components (AnimatedPage)
│
├── pages/                  # Page components (route targets)
│   ├── admin/             # Admin pages (AdminDashboard, OrganizationsManager)
│   ├── superadmin/        # SuperAdmin pages (UserManagement)
│   ├── Dashboard.tsx      # Main dashboard
│   ├── ScanPage.tsx       # QR scanning
│   ├── InspectionPage.tsx # Inspection form
│   ├── ReportsPage.tsx    # Reports & calendar
│   └── ...
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts         # Authentication state
│   ├── useIsAdmin.ts      # Role verification
│   ├── useReports.ts      # Reports data fetching
│   ├── useInspection.ts   # Inspection CRUD
│   ├── useQRScanner.ts    # QR scanning logic
│   └── ...
│
├── lib/                    # Utility functions & services
│   ├── supabase.ts        # Supabase client
│   ├── queryClient.ts     # React Query config
│   ├── logger.ts          # Logging service
│   ├── cloudinary.ts      # Image upload
│   ├── photoService.ts    # Photo processing
│   ├── pdfGenerator.ts    # PDF export
│   └── utils.ts           # Helper functions
│
├── types/                  # TypeScript type definitions
│   ├── database.types.ts  # Supabase generated types
│   └── ...
│
├── App.tsx                 # Root component + routing
├── main.tsx               # Entry point
└── App.css                # Global styles
```

---

## 🔄 State Management

### Architecture Pattern: **Server State + Local UI State**

We **do NOT use Redux or Zustand**. Instead:

1. **Server State** (95% of state) → **React Query**
2. **Local UI State** (5%) → **React useState/useReducer**
3. **Auth State** → **useAuth hook** (wraps Supabase auth)

### React Query Configuration:

```typescript
// lib/queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,  // ✅ Refetch when user returns
      refetchOnMount: true,         // ✅ Fresh data on mount
      refetchOnReconnect: true,     // ✅ Refetch on reconnect
      retry: 1,                     // ⚡ Retry once
      staleTime: 2 * 60 * 1000,    // ⚡ Cache 2 minutes
      gcTime: 5 * 60 * 1000,       // ⚡ Keep in memory 5 minutes
    },
    mutations: {
      retry: 0,                     // ❌ No retry for mutations
    },
  },
});
```

### Why React Query?

| Feature | Benefit |
|---------|---------|
| **Automatic caching** | Reduces API calls by 80%+ |
| **Background refetching** | Always fresh data |
| **Optimistic updates** | Instant UI feedback |
| **Pagination support** | Built-in infinite scroll |
| **Devtools** | Easy debugging |
| **Request deduplication** | Prevents duplicate API calls |

---

## 🎣 Custom Hooks

### Core Hooks:

#### 1. **useAuth** - Authentication State
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Returns: { user, loading, signOut }
}
```

**Usage:**
```typescript
const { user, loading, signOut } = useAuth();
if (loading) return <Spinner />;
if (!user) return <Navigate to="/login" />;
```

---

#### 2. **useIsAdmin** - Role Verification (Backend API)
```typescript
// hooks/useIsAdmin.ts
export function useIsAdmin() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['verify-role', user?.id],
    queryFn: async () => {
      // ✅ Calls backend API /api/auth/verify-role
      const response = await fetch('/api/auth/verify-role', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.json();
    },
  });

  // Returns: { isAdmin, isSuperAdmin, loading }
}
```

**Usage:**
```typescript
const { isAdmin, isSuperAdmin } = useIsAdmin();

{isAdmin && <AdminButton />}
{isSuperAdmin && <UserManagementLink />}
```

---

#### 3. **useReports** - Inspection Reports
```typescript
// hooks/useReports.ts
export const useMonthlyInspections = (
  userId: string | undefined,
  currentDate: Date,
  enabled: boolean = true,
  buildingId?: string
) => {
  return useQuery({
    queryKey: ['monthly-inspections', userId || 'all', format(currentDate, 'yyyy-MM'), buildingId],
    queryFn: async () => {
      // ✅ Calls backend API /api/reports
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.json();
    },
    enabled,
  });
};
```

**Usage:**
```typescript
const { data: dateInspections } = useMonthlyInspections(
  userId,
  currentDate,
  true,
  buildingId
);
```

---

#### 4. **useInspection** - Create/Update Inspections
```typescript
// hooks/useInspection.ts
export function useInspection() {
  const createInspection = useMutation({
    mutationFn: async (data: InspectionData) => {
      // ✅ Calls backend API /api/inspections
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });

  // Returns: { createInspection, updateInspection, deleteInspection }
}
```

---

#### 5. **useQRScanner** - QR Code Scanning
```typescript
// hooks/useQRScanner.ts
export function useQRScanner(onScanSuccess: (locationId: string) => void) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScanner = () => {
    // Uses html5-qrcode library
  };

  // Returns: { scanning, error, startScanner, stopScanner }
}
```

---

### Complete Hook List:

| Hook | Purpose | Backend API |
|------|---------|-------------|
| **useAuth** | Authentication state | Supabase Auth |
| **useIsAdmin** | Role verification | /api/auth/verify-role |
| **useReports** | Monthly/daily inspections | /api/reports |
| **useInspection** | Create/update inspections | /api/inspections |
| **useInspections** | List user inspections | /api/inspections |
| **useAdminInspections** | Admin view all inspections | /api/admin/inspections |
| **useLocations** | Location CRUD | /api/admin/locations |
| **useOrganizations** | Organization CRUD | /api/admin/organizations |
| **useBuildings** | Building CRUD | /api/admin/buildings |
| **useUserRoles** | User & role management | /api/admin/* |
| **useAuditLogs** | Audit log viewing | /api/admin/audit-logs |
| **useAdminStats** | Dashboard statistics | /api/admin/stats |
| **useQRScanner** | QR code scanning | - (client-side) |
| **usePWAInstall** | PWA install prompt | - (client-side) |
| **useHaptic** | Haptic feedback | - (client-side) |
| **usePerformance** | Performance monitoring | - (client-side) |

---

## 🧩 Components Architecture

### Component Hierarchy:

```
App (Router + QueryProvider)
├── ErrorBoundary
├── AppContent (routing logic)
│   ├── LoginPage / RegisterPage (public)
│   └── Protected Routes
│       ├── MainLayout / ProtectedLayout
│       │   ├── Sidebar (desktop)
│       │   ├── Navbar (mobile)
│       │   ├── BottomNav (mobile)
│       │   └── Page Content
│       │       ├── Dashboard
│       │       ├── ScanPage
│       │       ├── InspectionPage
│       │       ├── ReportsPage
│       │       └── AdminPages (role-protected)
│       └── Modals (global)
│           ├── InspectionDetailModal
│           ├── PhotoReviewModal
│           └── ScanModal
├── PWAInstallPrompt (global)
├── DebugPanel (dev only)
└── CustomToaster (notifications)
```

### Component Categories:

#### **1. UI Components** (`components/ui/`)

Base reusable components with no business logic:

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  // Tailwind-based styling
}
```

**Components:**
- `Button` - All button variants
- `Input` - Text inputs
- `Card` - Container cards
- `Badge` - Status badges
- `Skeleton` - Loading placeholders
- `LoadingSpinner` - Loading state
- `StatCard` - Dashboard stat cards
- `ActionButton` - FAB buttons

---

#### **2. Layout Components** (`components/layout/`)

Page structure and navigation:

```typescript
// components/layout/Sidebar.tsx
export function Sidebar() {
  const { isAdmin, isSuperAdmin } = useIsAdmin();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside>
      {/* Navigation items */}
      {isAdmin && <AdminLinks />}
      {isSuperAdmin && <SuperAdminLinks />}
    </motion.aside>
  );
}
```

**Components:**
- `Sidebar` - Desktop sidebar navigation
- `MainLayout` - Main page wrapper
- `ProtectedLayout` - Auth-protected wrapper

---

#### **3. Form Components** (`components/forms/`)

Complex form logic with validation:

```typescript
// components/forms/ComprehensiveInspectionForm.tsx
export function ComprehensiveInspectionForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(inspectionSchema),
  });

  const { createInspection } = useInspection();

  const onSubmit = (data) => {
    createInspection.mutate(data);
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

**Components:**
- `ComprehensiveInspectionForm` - Main inspection form
- `LocationForm` - Location creation
- `EnhancedPhotoUpload` - Photo upload with compression
- `RatingSelector` - Rating UI component

---

#### **4. Report Components** (`components/reports/`)

Data visualization and reports:

```typescript
// components/reports/CalendarView.tsx
export function CalendarView() {
  const { data: monthlyData } = useMonthlyInspections(userId, currentDate);

  return (
    <Calendar
      onDateSelect={handleDateSelect}
      inspectionData={monthlyData}
    />
  );
}
```

**Components:**
- `CalendarView` - Monthly calendar with inspection data
- `InspectionDetailModal` - Inspection detail view
- `PhotoReviewModal` - Photo gallery view
- `InspectionDrawer` - Mobile slide-up drawer

---

#### **5. Admin Components** (`components/admin/`)

Admin-specific UI and route guards:

```typescript
// components/admin/AdminRoute.tsx
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return <Navigate to="/" />;

  return <>{children}</>;
}
```

**Components:**
- `AdminRoute` - Admin-only route guard
- `AdminCard` - Admin dashboard cards

---

### Component Best Practices:

1. **Single Responsibility** - Each component does ONE thing well
2. **Props over State** - Prefer props for data flow
3. **TypeScript Interfaces** - All props must be typed
4. **Error Boundaries** - Wrap risky components
5. **Lazy Loading** - Use React.lazy() for heavy components
6. **Memoization** - Use React.memo() for expensive renders

---

## 🛣️ Routing Strategy

### React Router v6 with Lazy Loading:

```typescript
// App.tsx
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then(module => ({ default: module.Dashboard }))
);

<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<LoginPage />} />

  {/* Protected Routes */}
  <Route
    path="/"
    element={user ? <Dashboard /> : <Navigate to="/login" />}
  />

  {/* Admin Routes (double-protected) */}
  <Route
    path="/admin"
    element={user ? <AdminRoute><AdminDashboard /></AdminRoute> : <Navigate to="/login" />}
  />
</Routes>
```

### Route Guards:

```
┌─────────────────────────────────────┐
│  Route Protection Layers            │
├─────────────────────────────────────┤
│  1. Auth Check (user exists?)       │
│  2. AdminRoute (isAdmin = true?)    │
│  3. Page-level check (extra safety) │
└─────────────────────────────────────┘
```

### Route List:

| Route | Component | Protection |
|-------|-----------|------------|
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/` | Dashboard | Auth required |
| `/scan` | ScanPage | Auth required |
| `/inspect/:id` | InspectionPage | Auth required |
| `/reports` | ReportsPage | Auth required |
| `/analytics` | AnalyticsPage | Auth required |
| `/admin` | AdminDashboard | Admin (level 80+) |
| `/admin/organizations` | OrganizationsManager | Admin (level 80+) |
| `/admin/buildings` | BuildingsManager | Admin (level 80+) |
| `/admin/locations` | LocationsManager | Admin (level 80+) |
| `/superadmin/user-management` | UserManagement | SuperAdmin (level 100) |

---

## ⚡ Performance Optimizations

### 1. **Code Splitting with Lazy Loading**

```typescript
// ❌ BAD: All pages loaded upfront
import { Dashboard } from './pages/Dashboard';

// ✅ GOOD: Load on-demand
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

**Impact:**
- Initial bundle: ~500KB → ~150KB (70% reduction)
- First paint: ~2s → ~0.8s (60% faster)

---

### 2. **Image Optimization**

```typescript
// lib/photoService.ts
export async function compressImage(file: File): Promise<File> {
  return await imageCompression(file, {
    maxSizeMB: 1,           // Max 1MB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true,     // Background thread
  });
}
```

**Impact:**
- Photo upload: 5MB → 800KB (84% reduction)
- Upload time: ~15s → ~2s (87% faster)

---

### 3. **React Query Caching**

```typescript
// Automatic caching prevents duplicate requests
const { data } = useQuery({
  queryKey: ['inspections'],
  staleTime: 2 * 60 * 1000, // Cache 2 minutes
});

// ✅ Second call within 2 minutes = instant (from cache)
```

**Impact:**
- API calls reduced by 80%+
- Page navigation feels instant

---

### 4. **Framer Motion Optimizations**

```typescript
// components/animations/AnimatedPage.tsx
export const AnimatedPage = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }} // Fast animations (< 300ms)
  >
    {children}
  </motion.div>
);
```

---

### 5. **Asset Caching (Vercel)**

```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Impact:**
- CSS/JS bundles cached for 1 year
- Repeat visits: ~500ms → ~50ms (90% faster)

---

## 📐 Best Practices

### 1. **TypeScript Everywhere**

```typescript
// ✅ GOOD: Explicit types
interface InspectionFormProps {
  locationId: string;
  onSuccess: () => void;
}

export function InspectionForm({ locationId, onSuccess }: InspectionFormProps) {
  // ...
}

// ❌ BAD: No types
export function InspectionForm(props) {
  // ...
}
```

---

### 2. **Error Handling**

```typescript
// ✅ GOOD: Try-catch + user feedback
const { mutate } = useMutation({
  mutationFn: async (data) => {
    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create inspection');
      }

      return response.json();
    } catch (error) {
      toast.error('Failed to save inspection. Please try again.');
      throw error;
    }
  },
});
```

---

### 3. **Component Organization**

```typescript
// ✅ GOOD: Logical ordering
function MyComponent() {
  // 1. Hooks
  const { user } = useAuth();
  const [state, setState] = useState();

  // 2. Derived state
  const isAdmin = checkAdmin(user);

  // 3. Effects
  useEffect(() => {}, []);

  // 4. Event handlers
  const handleClick = () => {};

  // 5. Render helpers
  const renderSection = () => {};

  // 6. Return JSX
  return <div>...</div>;
}
```

---

### 4. **Custom Hook Patterns**

```typescript
// ✅ GOOD: Reusable hook
export function useInspections(userId?: string) {
  return useQuery({
    queryKey: ['inspections', userId],
    queryFn: async () => {
      // Fetch logic
    },
  });
}

// Usage:
const { data, isLoading, error } = useInspections(userId);
```

---

### 5. **Avoid Prop Drilling**

```typescript
// ❌ BAD: Prop drilling through 5 levels
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user}>
      <GreatGrandChild user={user} />
    </GrandChild>
  </Child>
</Parent>

// ✅ GOOD: Use context or custom hook
function GreatGrandChild() {
  const { user } = useAuth(); // Direct access
}
```

---

## 🔍 Debugging Tools

### 1. **React Query Devtools**

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### 2. **Custom Debug Panel**

```typescript
// components/DebugPanel.tsx
export function DebugPanel() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  if (import.meta.env.PROD) return null; // Only in dev

  return (
    <div className="fixed bottom-0 right-0 bg-black text-white p-4">
      <pre>{JSON.stringify({ user, isAdmin }, null, 2)}</pre>
    </div>
  );
}
```

### 3. **Console Logging**

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
};
```

---

## 🚀 Getting Started (Developer Onboarding)

### 1. **Clone and Install**
```bash
git clone <repo>
cd wc-checks
pnpm install
```

### 2. **Setup Environment**
```bash
cp .env.example .env.local
# Fill in Supabase + Cloudinary credentials
```

### 3. **Run Development Server**
```bash
vercel dev  # With API routes
# OR
pnpm dev    # Frontend only
```

### 4. **Key Files to Understand**
1. `src/App.tsx` - Routing and app structure
2. `src/hooks/useAuth.ts` - Authentication
3. `src/hooks/useIsAdmin.ts` - Role checks
4. `src/components/layout/Sidebar.tsx` - Navigation
5. `api/middleware/role-guard.ts` - Backend auth

---

## 📚 Further Reading

- [React Query Docs](https://tanstack.com/query/latest)
- [React Router Docs](https://reactrouter.com/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Vite Docs](https://vitejs.dev/)

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code style guide
- Component patterns
- PR process
- Testing requirements

---

**Questions?** Check the inline code comments or ask the team!
