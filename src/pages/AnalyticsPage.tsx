// src/pages/AnalyticsPage.tsx - WITH SIDEBAR
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Download,
  ChevronDown,
  AlertTriangle,
  Activity,
  Menu
} from 'lucide-react';

// Components
import { Card, CardHeader } from '../components/ui/Card';
import { BottomNav } from '../components/mobile/BottomNav';
import { Sidebar } from '../components/mobile/Sidebar';

type TimePeriod = 'week' | 'month' | 'year';

interface AnalyticsData {
  totalInspections: number;
  avgScore: number;
  scoreChange: number;
  countChange: number;
  dailyTrend: Array<{ date: string; count: number; avgScore: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
  peakHour: { hour: number; count: number } | null;
  locationPerformance: Array<{
    id: string;
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    count: number;
    trend: number;
  }>;
  scoreRanges: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  topPerformer: {
    id: string;
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    count: number;
    trend: number;
  } | null;
  needsAttention: Array<{
    id: string;
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    count: number;
    trend: number;
  }>;
}

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ FIX: Fetch analytics data via API endpoint (no direct Supabase query)
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', user?.id, selectedPeriod, isAdmin],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('[Analytics] 🚀 Fetching via API:', {
        userId: user.id,
        isAdmin,
        period: selectedPeriod,
        willSeeAllUsers: isAdmin,
      });

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      // Build API URL - use /api/reports with analytics=true
      let apiUrl = `/api/reports?analytics=true&period=${selectedPeriod}`;

      // Admin sees ALL users (no userId param), regular users see only their own (backend handles this)
      // We don't pass userId param, backend will check isAdmin and filter accordingly

      console.log('[Analytics] API call:', { apiUrl, isAdmin });

      // Call API endpoint
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('[Analytics] API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const result = await response.json();
      const analyticsData: AnalyticsData = result.data;

      console.log('[Analytics] ✅ Received analytics data:', {
        totalInspections: analyticsData.totalInspections,
        avgScore: analyticsData.avgScore,
      });

      return analyticsData;
    },
    // ✅ Wait for admin check to complete before fetching
    enabled: !!user?.id && !adminLoading,
    retry: 2,
  });

  const periodLabels = {
    week: 'Minggu Ini',
    month: 'Bulan Ini',
    year: 'Tahun Ini'
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Gagal Memuat Analitik</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak terduga'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ✅ Show loading while admin check OR data fetch is in progress
  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">
            {adminLoading ? 'Memeriksa hak akses...' : 'Memuat analitik...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header - White Theme */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Analitik</h1>
              <p className="text-sm text-gray-500">Wawasan kinerja & tren</p>
            </div>
          </div>
          <BarChart3 className="w-6 h-6 text-gray-400" />
        </div>

        {/* Period Selector - White Theme */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="w-full bg-white shadow-md border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between text-gray-900 font-medium hover:shadow-lg transition-shadow"
          >
            <span>{periodLabels[selectedPeriod]}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
          </button>

          {showFilterMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowFilterMenu(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20">
                {(['week', 'month', 'year'] as TimePeriod[]).map(period => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setShowFilterMenu(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                      ${selectedPeriod === period ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'}
                    `}
                  >
                    {periodLabels[period]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-white/80 text-xs mb-1">Total Inspeksi</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{analytics?.totalInspections || 0}</span>
              {analytics && analytics.countChange !== 0 && (
                <span className={`text-sm flex items-center gap-1 mb-1 ${analytics.countChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {analytics.countChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(analytics.countChange)}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-white/80 text-xs mb-1">Skor Rata-rata</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{analytics?.avgScore || 0}</span>
              {analytics && analytics.scoreChange !== 0 && (
                <span className={`text-sm flex items-center gap-1 mb-1 ${analytics.scoreChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {analytics.scoreChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(analytics.scoreChange)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Score Distribution */}
        <Card>
          <CardHeader
            title="Distribusi Skor"
            subtitle="Rincian kualitas"
            icon={<Activity className="w-5 h-5 text-purple-600" />}
          />
          <div className="space-y-3">
            {/* Excellent */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Sangat Baik (85-100)</span>
                <span className="text-sm font-bold text-green-600">{analytics?.scoreRanges.excellent || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                  style={{ 
                    width: analytics?.totalInspections 
                      ? `${(analytics.scoreRanges.excellent / analytics.totalInspections) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            {/* Good */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Baik (70-84)</span>
                <span className="text-sm font-bold text-yellow-600">{analytics?.scoreRanges.good || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ 
                    width: analytics?.totalInspections 
                      ? `${(analytics.scoreRanges.good / analytics.totalInspections) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            {/* Fair */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Cukup (50-69)</span>
                <span className="text-sm font-bold text-orange-600">{analytics?.scoreRanges.fair || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                  style={{ 
                    width: analytics?.totalInspections 
                      ? `${(analytics.scoreRanges.fair / analytics.totalInspections) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            {/* Poor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Perlu Perbaikan (0-49)</span>
                <span className="text-sm font-bold text-red-600">{analytics?.scoreRanges.poor || 0}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                  style={{ 
                    width: analytics?.totalInspections 
                      ? `${(analytics.scoreRanges.poor / analytics.totalInspections) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Peak Hours */}
        {analytics?.peakHour && (
          <Card>
            <CardHeader
              title="Jam Puncak Inspeksi"
              subtitle="Waktu paling aktif"
              icon={<Clock className="w-5 h-5 text-blue-600" />}
            />
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div>
                <div className="text-sm text-gray-600 mb-1">Tersibuk pada</div>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.peakHour.hour.toString().padStart(2, '0')}:00
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Total pemeriksaan</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.peakHour.count}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Location Performance */}
        <Card>
          <CardHeader
            title="Peringkat Lokasi"
            subtitle="Kinerja per lokasi"
            icon={<MapPin className="w-5 h-5 text-purple-600" />}
          />
          <div className="space-y-2">
            {analytics?.locationPerformance.slice(0, 10).map((loc, index) => (
              <div 
                key={loc.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                  ${index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                    index === 1 ? 'bg-gray-100 text-gray-600' : 
                    index === 2 ? 'bg-orange-100 text-orange-600' : 
                    'bg-gray-50 text-gray-500'}
                `}>
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{loc.name}</div>
                  <div className="text-xs text-gray-500">{loc.count} inspeksi</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{loc.avgScore}</div>
                  {loc.trend !== 0 && (
                    <div className={`text-xs flex items-center gap-0.5 ${loc.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {loc.trend > 0 ? '↑' : '↓'} {Math.abs(loc.trend)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!analytics?.locationPerformance.length && (
              <p className="text-center text-gray-500 py-8">Tidak ada data lokasi tersedia</p>
            )}
          </div>
        </Card>

        {/* Needs Attention */}
        {analytics?.needsAttention && analytics.needsAttention.length > 0 && (
          <Card>
            <CardHeader
              title="Perlu Perhatian"
              subtitle="Lokasi dengan skor di bawah 70"
              icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            />
            <div className="space-y-2">
              {analytics.needsAttention.map(loc => (
                <div 
                  key={loc.id}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{loc.name}</div>
                    <div className="text-xs text-gray-500">
                      {loc.building && `${loc.building} • `}{loc.floor}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-red-600">{loc.avgScore}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Export Button */}
        <button
          onClick={() => alert('Export feature coming soon!')}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-2xl font-medium text-gray-900 hover:bg-gray-50 transition-colors active:scale-95"
        >
          <Download className="w-5 h-5" />
          <span>Ekspor Laporan Analitik</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};