// src/pages/AnalyticsPage.tsx - SIMPLIFIED VERSION
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
 BarChart3,
 TrendingUp,
 TrendingDown,
 AlertTriangle,
 Menu,
 Calendar,
 Award,
 AlertCircle
} from 'lucide-react';

// Components
import { BottomNav } from '../components/mobile/BottomNav';
import { Sidebar } from '../components/mobile/Sidebar';

// ===== SIMPLIFIED ANALYTICS INTERFACE =====
interface SimpleAnalytics {
 // Overview
 totalInspections: number;
 avgScore: number;
 trend: 'up' | 'down' | 'stable';
 trendPercentage: number;

 // Status Breakdown
 statusBreakdown: {
 excellent: { count: number; percentage: number };
 good: { count: number; percentage: number };
 fair: { count: number; percentage: number };
 poor: { count: number; percentage: number };
 };

 // Top 3 best locations
 topLocations: Array<{
 name: string;
 building?: string;
 floor?: string;
 avgScore: number;
 inspectionCount: number;
 }>;

 // Top 3 worst locations (need attention)
 worstLocations: Array<{
 name: string;
 building?: string;
 floor?: string;
 avgScore: number;
 inspectionCount: number;
 }>;
}

export const AnalyticsPage = () => {
 const { user } = useAuth();
 const { isAdmin, loading: adminLoading } = useIsAdmin();

 // Default to current month (yyyy-MM)
 const now = new Date();
 const defaultMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

 const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
 const [sidebarOpen, setSidebarOpen] = useState(false);

 // ✅ Fetch simplified analytics data via API
 const { data: analytics, isLoading, error } = useQuery({
 queryKey: ['analytics', user?.id, selectedMonth, isAdmin],
 queryFn: async (): Promise<SimpleAnalytics> => {
 if (!user?.id) {
 throw new Error('User not authenticated');
 }

 console.log('[Analytics] 🚀 Fetching via API:', {
 userId: user.id,
 isAdmin,
 month: selectedMonth,
 willSeeAllUsers: isAdmin,
 });

 // Get auth token
 const { data: { session } } = await supabase.auth.getSession();
 const token = session?.access_token;

 if (!token) {
 throw new Error('No authentication token');
 }

 // Build API URL - use /api/reports with analytics=true&month=yyyy-MM
 const apiUrl = `/api/reports?analytics=true&month=${selectedMonth}`;

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
 const analyticsData: SimpleAnalytics = result.data;

 console.log('[Analytics] ✅ Received analytics data:', {
 totalInspections: analyticsData.totalInspections,
 avgScore: analyticsData.avgScore,
 trend: analyticsData.trend,
 });

 return analyticsData;
 },
 // ✅ Wait for admin check to complete before fetching
 enabled: !!user?.id && !adminLoading,
 retry: 2,
 });

 // Format month display (2024-11 → November 2024)
 const formatMonthDisplay = (monthStr: string) => {
 const [year, month] = monthStr.split('-');
 const date = new Date(parseInt(year), parseInt(month) - 1);
 return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
 };

 // Error state
 if (error) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
 <div className="text-center">
 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <AlertTriangle className="w-8 h-8 text-red-300" />
 </div>
 <h2 className="text-xl font-bold text-white mb-2">Gagal Memuat Analitik</h2>
 <p className="text-white/60 mb-4">
 {error instanceof Error ? error.message : 'Terjadi kesalahan'}
 </p>
 <button
 onClick={() => window.location.reload()}
 className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
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
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
 <p className="text-white/60 text-sm">
 {adminLoading ? 'Memeriksa hak akses...' : 'Memuat analitik...'}
 </p>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-6">
 {/* Sidebar */}
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

 {/* Header */}
 <div className="bg-white/8 backdrop-blur-xl px-3 py-2.5 shadow-xl border-b border-white/10 lg:py-3 lg:px-4">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <button
 onClick={() => setSidebarOpen(true)}
 className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
 >
 <Menu className="w-5 h-5" />
 </button>
 <div>
 <h1 className="text-xl font-bold text-white">Analitik</h1>
 <p className="text-sm text-white/50">Wawasan kinerja inspeksi</p>
 </div>
 </div>
 <BarChart3 className="w-6 h-6 text-blue-400" />
 </div>

 {/* Month Selector - Simple approach with visible input */}
 <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border-2 border-blue-500/20 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
 <Calendar className="w-5 h-5 text-white" />
 </div>
 <div className="flex-1">
 <label htmlFor="analytics-month" className="block text-xs text-blue-400 font-medium mb-1">
 Pilih Periode
 </label>
 <input
 id="analytics-month"
 type="month"
 value={selectedMonth}
 onChange={(e) => setSelectedMonth(e.target.value)}
 className="w-full px-3 py-2 bg-white/10 border border-blue-400/40 rounded-lg font-bold text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div className="p-4 space-y-4">
 {/* Overview Cards */}
 <div className="grid grid-cols-2 gap-3">
 {/* Total Inspections */}
 <div className="bg-white/8 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/10">
 <div className="text-white/50 text-xs mb-2">Total Inspeksi</div>
 <div className="text-3xl font-bold text-white">{analytics?.totalInspections || 0}</div>
 <div className="text-xs text-white/50 mt-1">{formatMonthDisplay(selectedMonth)}</div>
 </div>

 {/* Average Score */}
 <div className="bg-white/8 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/10">
 <div className="text-white/50 text-xs mb-2">Rata-rata Skor</div>
 <div className="flex items-end gap-2">
 <span className="text-3xl font-bold text-white">{analytics?.avgScore || 0}</span>
 {analytics && analytics.trend !== 'stable' && (
 <div className={`flex items-center gap-1 mb-1 ${analytics.trend === 'up' ? 'text-green-300' : 'text-red-300'}`}>
 {analytics.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
 <span className="text-sm font-medium">{Math.abs(analytics.trendPercentage)}%</span>
 </div>
 )}
 </div>
 <div className={`text-xs mt-1 ${analytics?.trend === 'up' ? 'text-green-300' : analytics?.trend === 'down' ? 'text-red-300' : 'text-white/50'}`}>
 {analytics?.trend === 'up' ? '↑ Meningkat' : analytics?.trend === 'down' ? '↓ Menurun' : '→ Stabil'}
 </div>
 </div>
 </div>

 {/* Status Breakdown */}
 <div className="bg-white/8 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/10">
 <h2 className="font-bold text-white mb-4 flex items-center gap-2">
 <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
 <BarChart3 className="w-4 h-4 text-purple-300" />
 </div>
 Distribusi Kualitas
 </h2>
 <div className="space-y-3">
 {/* Excellent */}
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium text-white">Sangat Baik</span>
 <span className="text-sm font-bold text-green-300">
 {analytics?.statusBreakdown.excellent.count || 0} ({analytics?.statusBreakdown.excellent.percentage || 0}%)
 </span>
 </div>
 <div className="w-full bg-white/10 rounded-full h-2">
 <div
 className="bg-green-600 h-2 rounded-full transition-all"
 style={{ width: `${analytics?.statusBreakdown.excellent.percentage || 0}%` }}
 />
 </div>
 </div>

 {/* Good */}
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium text-white">Baik</span>
 <span className="text-sm font-bold text-blue-400">
 {analytics?.statusBreakdown.good.count || 0} ({analytics?.statusBreakdown.good.percentage || 0}%)
 </span>
 </div>
 <div className="w-full bg-white/10 rounded-full h-2">
 <div
 className="bg-blue-600 h-2 rounded-full transition-all"
 style={{ width: `${analytics?.statusBreakdown.good.percentage || 0}%` }}
 />
 </div>
 </div>

 {/* Fair */}
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium text-white">Cukup</span>
 <span className="text-sm font-bold text-yellow-600">
 {analytics?.statusBreakdown.fair.count || 0} ({analytics?.statusBreakdown.fair.percentage || 0}%)
 </span>
 </div>
 <div className="w-full bg-white/10 rounded-full h-2">
 <div
 className="bg-yellow-600 h-2 rounded-full transition-all"
 style={{ width: `${analytics?.statusBreakdown.fair.percentage || 0}%` }}
 />
 </div>
 </div>

 {/* Poor */}
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium text-white">Buruk</span>
 <span className="text-sm font-bold text-red-300">
 {analytics?.statusBreakdown.poor.count || 0} ({analytics?.statusBreakdown.poor.percentage || 0}%)
 </span>
 </div>
 <div className="w-full bg-white/10 rounded-full h-2">
 <div
 className="bg-red-600 h-2 rounded-full transition-all"
 style={{ width: `${analytics?.statusBreakdown.poor.percentage || 0}%` }}
 />
 </div>
 </div>
 </div>
 </div>

 {/* Top 3 Best Locations */}
 <div className="bg-white/8 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/10">
 <h2 className="font-bold text-white mb-4 flex items-center gap-2">
 <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
 <Award className="w-4 h-4 text-green-300" />
 </div>
 Lokasi Terbaik
 </h2>
 {analytics?.topLocations && analytics.topLocations.length > 0 ? (
 <div className="space-y-3">
 {analytics.topLocations.map((location, index) => (
 <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
 <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
 #{index + 1}
 </div>
 <div className="flex-1">
 <div className="font-medium text-white">{location.name}</div>
 <div className="text-xs text-white/50">
 {location.building && `Gedung ${location.building}`}
 {location.building && location.floor && ' • '}
 {location.floor && `Lantai ${location.floor}`}
 </div>
 </div>
 <div className="text-right">
 <div className="text-lg font-bold text-green-300">{location.avgScore}</div>
 <div className="text-xs text-white/50">{location.inspectionCount}x</div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-white/50">
 <Award className="w-12 h-12 mx-auto mb-2 text-white/30" />
 <p className="text-sm">Belum ada data</p>
 </div>
 )}
 </div>

 {/* Top 3 Worst Locations */}
 <div className="bg-white/8 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/10">
 <h2 className="font-bold text-white mb-4 flex items-center gap-2">
 <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
 <AlertCircle className="w-4 h-4 text-red-300" />
 </div>
 Perlu Perhatian
 </h2>
 {analytics?.worstLocations && analytics.worstLocations.length > 0 ? (
 <div className="space-y-3">
 {analytics.worstLocations.map((location, index) => (
 <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
 <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
 !
 </div>
 <div className="flex-1">
 <div className="font-medium text-white">{location.name}</div>
 <div className="text-xs text-white/50">
 {location.building && `Gedung ${location.building}`}
 {location.building && location.floor && ' • '}
 {location.floor && `Lantai ${location.floor}`}
 </div>
 </div>
 <div className="text-right">
 <div className="text-lg font-bold text-red-300">{location.avgScore}</div>
 <div className="text-xs text-white/50">{location.inspectionCount}x</div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-white/50">
 <AlertCircle className="w-12 h-12 mx-auto mb-2 text-white/30" />
 <p className="text-sm">Semua lokasi dalam kondisi baik</p>
 </div>
 )}
 </div>
 </div>

 {/* Bottom Navigation */}
 <div className="lg:hidden"><BottomNav /></div>
 </div>
 );
};
