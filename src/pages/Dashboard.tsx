// src/pages/Dashboard.tsx - WITH SIDEBAR
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useInspections, useAdminInspections } from '../hooks/useInspections';
import {
  QrCode,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  Clock,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { BottomNav } from '../components/mobile/BottomNav';
import { Sidebar } from '../components/mobile/Sidebar';
// PWA removed - no install prompt needed
import { SkeletonStats, SkeletonActivity } from '../components/ui/Skeleton';
import { useHaptic } from '../hooks/useHaptic';

export const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const haptic = useHaptic();

  // Request GPS & Camera permissions on mount
  useEffect(() => {
    // Request GPS permission
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          console.log('📍 GPS permission granted');
        },
        (error) => {
          console.warn('📍 GPS permission denied or unavailable:', error.message);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }

    // Request Camera permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          console.log('📸 Camera permission granted');
          // Stop the stream immediately (we just needed permission)
          stream.getTracks().forEach(track => track.stop());
        })
        .catch((error) => {
          console.warn('📸 Camera permission denied or unavailable:', error.message);
        });
    }
  }, []);

  // ✅ WAIT for auth to complete AND user to exist AND admin check to complete
  const isAuthReady = !authLoading && !adminLoading && !!user?.id;

  // 🔍 DEBUG: Log admin status
  console.log('[Dashboard] 🔐 Admin status:', {
    userId: user?.id,
    isAdmin,
    willSeeAllUsers: isAdmin,
  });

  // Fetch inspections via API - admin or user endpoint
  const { data: userInspections, isLoading: userInspectionsLoading } = useInspections();
  const { data: adminInspections, isLoading: adminInspectionsLoading } = useAdminInspections(100);

  // Use admin data if admin, otherwise use user data
  const inspections = isAdmin ? adminInspections : userInspections;
  const statsLoading = isAdmin ? adminInspectionsLoading : userInspectionsLoading;

  // Calculate stats from inspections
  const stats = inspections ? (() => {
    const total = inspections.length;

    // ✅ Better date handling - account for timezone
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const todayCount = inspections.filter((i: any) => {
        if (!i.inspection_date) return false;
        // Try multiple date comparison methods
        if (i.inspection_date === todayStr) return true;
        if (i.inspection_date.startsWith(todayStr)) return true;

        // Parse the stored date and compare
        try {
          const inspDate = new Date(i.inspection_date);
          return inspDate.getFullYear() === today.getFullYear() &&
                 inspDate.getMonth() === today.getMonth() &&
                 inspDate.getDate() === today.getDate();
        } catch {
          return false;
        }
    }).length;

    const completed = inspections.filter((i: any) => {
      return i.overall_status === 'completed' ||
             i.overall_status === 'excellent' ||
             i.overall_status === 'good' ||
             (i.responses?.score && i.responses.score >= 60);
    }).length;

    // Calculate average score
    const avgScore = inspections.length > 0
      ? Math.round(
          inspections.reduce((sum: number, inspection: any) => {
            // Try to get score from responses
            const score = inspection.responses?.score ||
                         (inspection.overall_status === 'excellent' ? 95 :
                          inspection.overall_status === 'good' ? 80 :
                          inspection.overall_status === 'fair' ? 65 : 50);
            return sum + score;
          }, 0) / inspections.length
        )
      : 0;

    // Weekly insights - breakdown by status
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    const weeklyInspections = inspections.filter((i: any) =>
      i.inspection_date >= oneWeekAgoStr
    );

    const weeklyBreakdown = {
      excellent: weeklyInspections.filter((i: any) => i.overall_status === 'excellent').length,
      good: weeklyInspections.filter((i: any) => i.overall_status === 'good').length,
      fair: weeklyInspections.filter((i: any) => i.overall_status === 'fair').length,
      poor: weeklyInspections.filter((i: any) =>
        i.overall_status !== 'excellent' &&
        i.overall_status !== 'good' &&
        i.overall_status !== 'fair'
      ).length,
      total: weeklyInspections.length,
    };

    const recentData = inspections.slice(0, 3);

    return {
      total,
      todayCount,
      completed,
      avgScore,
      weeklyBreakdown,
      recent: recentData,
    };
  })() : null;

  // ✅ Use default empty stats if no data (removed redundant auth check - handled by App.tsx routing)
  const dashboardStats = stats || {
    total: 0,
    todayCount: 0,
    completed: 0,
    avgScore: 0,
    weeklyBreakdown: { excellent: 0, good: 0, fair: 0, poor: 0, total: 0 },
    recent: [],
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Simple Header - White */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Proservice Indonesia"
                className="h-8 w-auto"
                onError={(e) => {
                  // If logo fails to load, hide it (text will remain)
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Proservice Indonesia</h1>
                <p className="text-sm text-gray-500">
                  Hai, {profile?.full_name || user?.email?.split('@')[0] || 'Pengguna'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <User className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-5 space-y-5">
        {/* Stats Cards - 2x2 Grid */}
        {statsLoading ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
            <p className="text-3xl font-bold text-gray-900">{dashboardStats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
            <p className="text-3xl font-bold text-blue-600">{dashboardStats.todayCount}</p>
            <p className="text-xs text-gray-500 mt-1">Hari Ini</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
            <p className="text-3xl font-bold text-green-600">{dashboardStats.completed}</p>
            <p className="text-xs text-gray-500 mt-1">Selesai</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
            <p className="text-3xl font-bold text-purple-600">{dashboardStats.avgScore}</p>
            <p className="text-xs text-gray-500 mt-1">Rata-rata</p>
          </div>
        </div>
        )}

        {/* Primary Action - Big Button with 3D Shadow */}
        <button
          onClick={() => {
            haptic.medium();
            navigate('/scan');
          }}
          type="button"
          className="w-full bg-white rounded-3xl p-6 shadow-[0_12px_40px_rgb(0,0,0,0.12)] active:shadow-[0_8px_30px_rgb(0,0,0,0.1)] active:translate-y-1 active:scale-98 transition-all border border-gray-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-lg text-gray-900">Pindai Kode QR</p>
              <p className="text-gray-500 text-sm">Mulai inspeksi baru</p>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </div>
        </button>

        {/* Quick Insights - Weekly Performance */}
        {dashboardStats.weeklyBreakdown.total > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Performa Minggu Ini</h3>
              <span className="text-sm text-gray-600">{dashboardStats.weeklyBreakdown.total} inspeksi</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {dashboardStats.weeklyBreakdown.excellent > 0 && (
                <div className="bg-white/70 rounded-xl p-3 flex items-center gap-2">
                  <div className="text-xl">✅</div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{dashboardStats.weeklyBreakdown.excellent}</div>
                    <div className="text-xs text-gray-600">Sangat Baik</div>
                  </div>
                </div>
              )}
              {dashboardStats.weeklyBreakdown.good > 0 && (
                <div className="bg-white/70 rounded-xl p-3 flex items-center gap-2">
                  <div className="text-xl">👍</div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{dashboardStats.weeklyBreakdown.good}</div>
                    <div className="text-xs text-gray-600">Baik</div>
                  </div>
                </div>
              )}
              {dashboardStats.weeklyBreakdown.fair > 0 && (
                <div className="bg-white/70 rounded-xl p-3 flex items-center gap-2">
                  <div className="text-xl">🟡</div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">{dashboardStats.weeklyBreakdown.fair}</div>
                    <div className="text-xs text-gray-600">Cukup</div>
                  </div>
                </div>
              )}
              {dashboardStats.weeklyBreakdown.poor > 0 && (
                <div className="bg-white/70 rounded-xl p-3 flex items-center gap-2">
                  <div className="text-xl">⚠️</div>
                  <div>
                    <div className="text-lg font-bold text-red-600">{dashboardStats.weeklyBreakdown.poor}</div>
                    <div className="text-xs text-gray-600">Perlu Perbaikan</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions - Simple Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              haptic.light();
              navigate('/locations');
            }}
            className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:shadow-[0_4px_20px_rgb(0,0,0,0.06)] active:translate-y-1 active:scale-95 transition-all border border-gray-50"
          >
            <MapPin className="w-7 h-7 text-blue-600 mb-3" />
            <p className="font-semibold text-gray-900 text-sm">Lokasi</p>
          </button>

          <button
            onClick={() => {
              haptic.light();
              navigate('/reports');
            }}
            className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:shadow-[0_4px_20px_rgb(0,0,0,0.06)] active:translate-y-1 active:scale-95 transition-all border border-gray-50"
          >
            <Calendar className="w-7 h-7 text-blue-600 mb-3" />
            <p className="font-semibold text-gray-900 text-sm">Laporan</p>
          </button>
        </div>

        {/* Recent Activity - Minimal */}
        {statsLoading ? (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Terbaru</h2>
            </div>
            <SkeletonActivity />
          </div>
        ) : dashboardStats.recent && dashboardStats.recent.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Terbaru</h2>
              <button
                onClick={() => navigate('/reports')}
                className="text-blue-600 text-sm font-medium"
              >
                Lihat Semua
              </button>
            </div>
            <div className="space-y-3">
              {dashboardStats.recent.slice(0, 3).map((inspection: any) => {
                const location = inspection.locations;
                const locationName = location?.name || 'Lokasi tidak diketahui';
                const buildingName = location?.buildings?.name || '';
                const locationDetail = location?.floor
                  ? `${buildingName} • ${location.floor}`.trim().replace(/^• /, '')
                  : buildingName;

                // Format time nicely
                const isToday = inspection.inspection_date === new Date().toISOString().split('T')[0];
                const timeDisplay = isToday && inspection.inspection_time
                  ? inspection.inspection_time.substring(0, 5) // HH:MM
                  : inspection.inspection_date;

                return (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/reports?inspection=${inspection.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {inspection.overall_status === 'completed' ||
                       inspection.overall_status === 'excellent' ||
                       inspection.overall_status === 'good' ? (
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{locationName}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>{isToday ? 'Hari ini' : inspection.inspection_date}</span>
                          {inspection.inspection_time && (
                            <>
                              <span>•</span>
                              <span>{timeDisplay}</span>
                            </>
                          )}
                        </div>
                        {locationDetail && (
                          <p className="text-xs text-gray-400 truncate">{locationDetail}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State - Simple */}
        {!statsLoading && dashboardStats.total === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Belum Ada Inspeksi
            </h3>
            <p className="text-gray-500 text-sm">
              Pindai kode QR untuk memulai
            </p>
          </div>
        )}
      </main>

      {/* PWA removed - pure web app */}

      <BottomNav />
    </div>
  );
};