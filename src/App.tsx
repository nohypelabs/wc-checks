// src/App.tsx - FIXED: Handle named exports for lazy loading
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { CustomToaster } from './lib/toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugPanel } from './components/DebugPanel';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
// import { UpdateNotification } from './components/common/UpdateNotification';
import { PageTransition } from './components/layout/PageTransition';
// import { IncomingFeaturesModal } from './components/common/IncomingFeaturesModal';
import { SessionExpiredModal } from './components/modals/SessionExpiredModal';
import { FeatureTour } from './components/tour/FeatureTour';
import { useAuth } from './hooks/useAuth';
// import { useIsAdmin } from './hooks/useIsAdmin';
import { logger } from './lib/logger';
import './App.css';

// EAGER LOAD: Critical pages (login flow only)
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// LAZY LOAD: Heavy pages loaded on-demand
// FIX: Handle named exports by mapping to default
const ScanPage = lazy(() => 
 import('./pages/ScanPage').then(module => ({ default: module.ScanPage }))
);
const InspectionPage = lazy(() => 
 import('./pages/InspectionPage').then(module => ({ default: module.InspectionPage }))
);
const ReportsPage = lazy(() => 
 import('./pages/ReportsPage').then(module => ({ default: module.ReportsPage }))
);
const AnalyticsPage = lazy(() => 
 import('./pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage }))
);
const ProfilePage = lazy(() => 
 import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage }))
);
const LocationsListPage = lazy(() =>
 import('./pages/LocationsListPage').then(module => ({ default: module.LocationsListPage }))
);
const AddLocationPage = lazy(() =>
 import('./pages/AddLocationPage').then(module => ({ default: module.AddLocationPage }))
);
const LocationsManager = lazy(() =>
 import('./pages/admin/LocationsManager').then(module => ({ default: module.LocationsManager }))
);
const OrganizationsManager = lazy(() =>
 import('./pages/admin/OrganizationsManager').then(module => ({ default: module.OrganizationsManager }))
);
const BuildingsManager = lazy(() =>
 import('./pages/admin/BuildingsManager').then(module => ({ default: module.BuildingsManager }))
);
const AdminDashboard = lazy(() =>
 import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard }))
);
const QRCodeGenerator = lazy(() =>
 import('./pages/admin/QRCodeGenerator').then(module => ({ default: module.QRCodeGenerator }))
);
const UserManagement = lazy(() =>
 import('./pages/superadmin/UserManagement').then(module => ({ default: module.UserManagement }))
);
const OccupationManagerPage = lazy(() =>
 import('./pages/admin/OccupationManagerPage').then(module => ({ default: module.OccupationManagerPage }))
);
const TemplatesManager = lazy(() =>
 import('./pages/admin/TemplatesManager').then(module => ({ default: module.TemplatesManager }))
);
const SettingsPage = lazy(() =>
 import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage }))
);
const HelpPage = lazy(() =>
 import('./pages/HelpPage').then(module => ({ default: module.HelpPage }))
);
const AboutPage = lazy(() =>
 import('./pages/AboutPage').then(module => ({ default: module.AboutPage }))
);
const ChangelogPage = lazy(() =>
 import('./pages/ChangelogPage').then(module => ({ default: module.ChangelogPage }))
);
const UpgradePage = lazy(() =>
 import('./pages/UpgradePage').then(module => ({ default: module.UpgradePage }))
);
const PaymentMethodPage = lazy(() =>
 import('./pages/PaymentMethodPage').then(module => ({ default: module.PaymentMethodPage }))
);

// ⚡ React Query - OPTIMIZED for performance + freshness balance
const queryClient = new QueryClient({
 defaultOptions: {
 queries: {
 refetchOnWindowFocus: false, // ⚡ Don't refetch on tab switch - staleTime handles freshness
 refetchOnMount: false, // ⚡ Don't refetch on mount if data is fresh
 refetchOnReconnect: true, // ✅ Refetch when internet reconnects
 retry: 1, // ⚡ Retry once (not infinite, not zero)
 staleTime: 2 * 60 * 1000, // ⚡ Cache 2 minutes - balance performance & freshness
 gcTime: 5 * 60 * 1000, // ⚡ Keep in memory 5 minutes - reduce re-fetching
 onError: (error: any) => {
 logger.error('React Query error', error);
 },
 },
 mutations: {
 retry: 0, // ❌ No retry for mutations
 onError: (error: any) => {
 logger.error('React Query mutation error', error);
 },
 },
 },
});

// Loading component
const PageLoader = () => (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
 <p className="text-white/60">Loading...</p>
 </div>
 </div>
);

// Auth loading component
const AuthLoader = () => (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
 <p className="text-white/60">Checking authentication...</p>
 </div>
 </div>
);

// Main Dashboard - Accessible to all users (shows AdminDashboard which has role-based content)
// No need for router - AdminDashboard already handles admin vs user content display

// 404 Page
const NotFoundPage = () => (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
 <div className="text-center">
 <h1 className="text-6xl font-bold text-white/20 mb-4">404</h1>
 <p className="text-white/60 mb-4">Page not found</p>
 <a
 href="/"
 className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
 >
 Back to Dashboard
 </a>
 </div>
 </div>
);

function AppContent() {
 const { user, loading, sessionExpired, clearSessionExpired, signOut } = useAuth();

 // DEBUG: Log auth state
 console.log('[AppContent] render:', JSON.stringify({ loading, hasUser: !!user, userId: user?.id }));

 // WAIT for auth to load before routing
 if (loading) {
 console.log('[AppContent] Showing AuthLoader - waiting for auth...');
 return <AuthLoader />;
 }

 console.log('[AppContent] Auth loaded, rendering routes');
 const location = useLocation();

 return (
 <>
 <AnimatePresence mode="wait">
 <Suspense fallback={<PageLoader />}>
 <Routes location={location} key={location.pathname}>
 {/* Public Routes */}
 <Route 
 path="/login" 
 element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
 />
 <Route 
 path="/register" 
 element={!user ? <RegisterPage /> : <Navigate to="/" replace />} 
 />

 {/* Protected Routes - Main */}
 <Route
 path="/"
 element={user ? <PageTransition><AdminDashboard /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/dashboard"
 element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />}
 />
 <Route
 path="/dashboard/user"
 element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />}
 />
 <Route
 path="/scan"
 element={user ? <PageTransition><ScanPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/inspect/:locationId"
 element={user ? <PageTransition><InspectionPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/reports"
 element={user ? <PageTransition><ReportsPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/history"
 element={user ? <PageTransition><ReportsPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/analytics"
 element={user ? <PageTransition><AnalyticsPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/locations"
 element={user ? <PageTransition><LocationsListPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/locations/add"
 element={user ? (
 <PageTransition><ErrorBoundary><AddLocationPage /></ErrorBoundary></PageTransition>
 ) : <Navigate to="/login" replace />}
 />
 <Route
 path="/admin/locations"
 element={user ? (
 <PageTransition><ErrorBoundary><LocationsManager /></ErrorBoundary></PageTransition>
 ) : <Navigate to="/login" replace />}
 />
 <Route
 path="/admin/organizations"
 element={user ? <PageTransition><OrganizationsManager /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/admin/buildings"
 element={user ? <PageTransition><BuildingsManager /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/superadmin/user-management"
 element={user ? <PageTransition><UserManagement /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/profile"
 element={user ? <PageTransition><ProfilePage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/settings"
 element={user ? <PageTransition><SettingsPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/help"
 element={user ? <PageTransition><HelpPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/about"
 element={user ? <PageTransition><AboutPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/changelog"
 element={user ? <PageTransition><ChangelogPage /></PageTransition> : <Navigate to="/login" replace />}
 />

 {/* Billing / Upgrade Routes */}
 <Route
 path="/upgrade"
 element={user ? <PageTransition><UpgradePage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/payment-method"
 element={user ? <PageTransition><PaymentMethodPage /></PageTransition> : <Navigate to="/login" replace />}
 />

 {/* Admin Routes - Same as main dashboard (accessible to all users) */}
 <Route
 path="/admin"
 element={user ? <PageTransition><AdminDashboard /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/admin/users"
 element={user ? <PageTransition><UserManagement /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/admin/occupations"
 element={user ? <PageTransition><OccupationManagerPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/admin/reports"
 element={user ? <PageTransition><ReportsPage /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/admin/templates"
 element={user ? <PageTransition><TemplatesManager /></PageTransition> : <Navigate to="/login" replace />}
 />
 <Route
 path="/admin/QRCodeGenerator"
 element={user ? <PageTransition><QRCodeGenerator /></PageTransition> : <Navigate to="/login" replace />}
 />

 {/* 404 */}
 <Route path="*" element={<NotFoundPage />} />
 </Routes>
 </Suspense>
 </AnimatePresence>
  
  
  {user && <FeatureTour />}
  {sessionExpired && (
    <SessionExpiredModal
      onLogin={() => { clearSessionExpired(); signOut(); window.location.href = '/login'; }}
      onRefresh={() => { clearSessionExpired(); window.location.reload(); }}
    />
  )}
 </>
 );
}

export default function App() {
 // Log app initialization
 logger.info('App initialized', {
 env: import.meta.env.MODE,
 version: '4.0.1',
 });

 return (
 <QueryClientProvider client={queryClient}>
 <Router>
 <ErrorBoundary>
 <AppContent />
 <PWAInstallPrompt />
 <DebugPanel />
 <CustomToaster />
 </ErrorBoundary>
 </Router>
 </QueryClientProvider>
 );
}