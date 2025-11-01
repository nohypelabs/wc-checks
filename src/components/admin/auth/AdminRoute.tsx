// src/components/auth/AdminRoute.tsx - BACKEND VERIFIED VERSION
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { AlertTriangle, User } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, profile, loading: authLoading } = useAuth();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useIsAdmin();

  // Loading state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Not authorized - Enhanced with profile info
  if (!isAdmin && !isSuperAdmin) {
    console.log('[AdminRoute] ACCESS DENIED - User is not admin', {
      user: profile?.full_name || user.email,
      isAdmin,
      isSuperAdmin,
    });

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* User info section */}
          <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {profile?.full_name || user.email}
              </p>
              <p className="text-xs text-gray-600">
                Role: User
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access admin pages. Admin privileges required.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('[AdminRoute] ACCESS GRANTED', {
    user: profile?.full_name || user.email,
    isAdmin,
    isSuperAdmin,
  });

  // Authorized - render admin content
  return <>{children}</>;
};