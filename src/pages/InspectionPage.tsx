// src/pages/InspectionPage.tsx
import { useParams, Navigate } from 'react-router-dom';
import { ComprehensiveInspectionForm } from '../components/forms/ComprehensiveInspectionForm';
import { AlertCircle } from 'lucide-react';
import { useIsAdmin } from '../hooks/useIsAdmin';

export const InspectionPage = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const { isAdmin, loading } = useIsAdmin();

  // Show loading while checking role
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Block direct URL access for non-admin users
  // Regular users must use QR scan button
  if (!isAdmin) {
    return <Navigate to="/scan" replace />;
  }

  if (!locationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Location</h2>
          <p className="text-white/60">No location ID provided in URL</p>
        </div>
      </div>
    );
  }

  return <ComprehensiveInspectionForm locationId={locationId} />;
};