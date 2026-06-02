// src/pages/admin/AdminDashboard.tsx - Main Dashboard (Admin & User) — Compact Mobile
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useAdminStats } from '../../hooks/useAdminStats';
import {
 Users,
 MapPin,
 Briefcase,
 FileText,
 TrendingUp,
 TrendingDown,
 Activity,
 Building2,
 Settings,
 BarChart3,
 Calendar,
 Menu,
} from 'lucide-react';
import { AdminCard } from '../../components/admin/AdminCard';
import { Card } from '../../components/ui/Card';
import { usePerformance } from '../../hooks/usePerformance';
import { Sidebar } from '../../components/mobile/Sidebar';
import { BottomNav } from '../../components/mobile/BottomNav';
import { InspectionTrendChart } from '../../components/dashboard/InspectionTrendChart';

export const AdminDashboard = () => {
 usePerformance('HomePage');
 const { profile } = useAuth();
 const { isAdmin } = useIsAdmin();
 const navigate = useNavigate();
 const [sidebarOpen, setSidebarOpen] = useState(false);

 const { data: stats, isLoading } = useAdminStats();

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20 lg:pb-0">
 {/* Sidebar - mobile only */}
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

 {/* Header - Compact */}
 <header className="bg-white/8 backdrop-blur-xl px-3 py-5 shadow-xl border-b border-white/10 lg:py-5 lg:px-4">
 <div className="max-w-7xl mx-auto flex items-center justify-between text-white">
 {/* Left Menu Button */}
 <button
 onClick={() => setSidebarOpen(true)}
 className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
 >
 <Menu className="w-5 h-5" />
 </button>

 {/* Desktop: Logo left */}
 <div className="hidden lg:flex items-center gap-2.5">
 <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center p-1">
 <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
 </div>
 <div>
 <h1 className="text-xl font-bold leading-tight text-white">Proservice Indonesia</h1>
 <p className="text-xs text-white/50">Aplikasi Toilet Ceklis Real Time</p>
 </div>
 </div>

 {/* Mobile: Centered Logo (compact) */}
 <div className="lg:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
 <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex items-center justify-center p-1">
 <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
 </div>
 <div className="flex flex-col">
 <h1 className="text-lg font-bold whitespace-nowrap leading-tight">Proservice Indonesia</h1>
 <p className="text-[10px] text-blue-100 whitespace-nowrap">Toilet Ceklis Real Time</p>
 </div>
 </div>

 {/* Right: Welcome + Settings */}
 <div className="flex items-center gap-1.5">
 <span className="hidden lg:inline text-xs text-white/60">
 Selamat datang, {isAdmin ? 'Admin' : 'User'} <span className="font-semibold text-white">{profile?.full_name?.split(' ')[0] || ''}</span>
 </span>
 <button
 onClick={() => navigate('/profile')}
 className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
 >
 <Settings className="w-4 h-4" />
 </button>
 </div>
 </div>
 </header>

 {/* Content */}
 <div className="max-w-7xl mx-auto px-3 lg:px-8 pt-3 lg:pt-5">
 {/* Trend Chart */}
 <div className="mb-3 lg:mb-5">
 <InspectionTrendChart
 inspectionGrowth={stats?.inspectionGrowth || 0}
 />
 </div>

 {/* Quick Stats — Glass effect on mobile */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-3 lg:mb-5">
 <Card className="p-2.5 lg:p-4 bg-white/8 backdrop-blur-md border border-white/10 shadow-lg shadow-blue-500/5 ring-1 ring-white/5">
 <div className="flex items-center gap-1.5 mb-1">
 <div className="w-6 h-6 lg:w-10 lg:h-10 bg-white/10 rounded-md lg:rounded-lg flex items-center justify-center">
 <Activity className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
 </div>
 {stats && stats.inspectionGrowth !== 0 && (
 <div className={`flex items-center gap-0.5 text-[10px] lg:text-sm font-medium ${
 stats.inspectionGrowth > 0 ? 'text-green-300' : 'text-red-300'
 }`}>
 {stats.inspectionGrowth > 0 ? <TrendingUp className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5" /> : <TrendingDown className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5" />}
 <span>{Math.abs(stats.inspectionGrowth)}%</span>
 </div>
 )}
 </div>
 <div className="text-xl lg:text-2xl font-bold text-white leading-none">{stats?.todayInspections || 0}</div>
 <div className="text-[10px] lg:text-sm text-white/60 mt-0.5">Hari Ini</div>
 </Card>

 <Card className="p-2.5 lg:p-4 bg-white/8 backdrop-blur-md border border-white/10 shadow-lg shadow-blue-500/5 ring-1 ring-white/5">
 <div className="flex items-center gap-1.5 mb-1">
 <div className="w-6 h-6 lg:w-10 lg:h-10 bg-white/10 rounded-md lg:rounded-lg flex items-center justify-center">
 <Calendar className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
 </div>
 </div>
 <div className="text-xl lg:text-2xl font-bold text-white leading-none">{stats?.inspections7d || 0}</div>
 <div className="text-[10px] lg:text-sm text-white/60 mt-0.5">7 Hari</div>
 </Card>

 <Card className="p-2.5 lg:p-4 bg-white/8 backdrop-blur-md border border-white/10 shadow-lg shadow-blue-500/5 ring-1 ring-white/5">
 <div className="flex items-center gap-1.5 mb-1">
 <div className="w-6 h-6 lg:w-10 lg:h-10 bg-white/10 rounded-md lg:rounded-lg flex items-center justify-center">
 <Calendar className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
 </div>
 </div>
 <div className="text-xl lg:text-2xl font-bold text-white leading-none">{stats?.inspections30d || 0}</div>
 <div className="text-[10px] lg:text-sm text-white/60 mt-0.5">30 Hari</div>
 </Card>

 <Card className="p-2.5 lg:p-4 bg-white/8 backdrop-blur-md border border-white/10 shadow-lg shadow-blue-500/5 ring-1 ring-white/5">
 <div className="flex items-center gap-1.5 mb-1">
 <div className="w-6 h-6 lg:w-10 lg:h-10 bg-white/10 rounded-md lg:rounded-lg flex items-center justify-center">
 <BarChart3 className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
 </div>
 </div>
 <div className="text-xl lg:text-2xl font-bold text-white leading-none">{stats?.totalInspections || 0}</div>
 <div className="text-[10px] lg:text-sm text-white/60 mt-0.5">Total</div>
 </Card>
 </div>

 {/* Two column layout on desktop: Management | Overview */}
 <div className="lg:grid lg:grid-cols-3 lg:gap-5 lg:items-stretch">
 {/* Management Cards - Admin Only */}
 {isAdmin && (
 <div className="mb-3 lg:mb-0 lg:col-span-2">
 <h2 className="text-sm lg:text-xl font-bold text-white lg:mb-3 mb-2">Management</h2>
 <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 lg:gap-3">
 <AdminCard
 icon={Users}
 title="Users"
 description="Manage users & roles"
 path="/admin/users"
 color="blue"
 count={stats?.totalUsers}
 />
 <AdminCard
 icon={MapPin}
 title="Locations"
 description="Locations & QR codes"
 path="/admin/locations"
 color="green"
 count={stats?.totalLocations}
 />
 <AdminCard
 icon={Briefcase}
 title="Jobs"
 description="Job titles & roles"
 path="/admin/occupations"
 color="purple"
 />
 <AdminCard
 icon={Building2}
 title="Orgs"
 description="Buildings & orgs"
 path="/admin/organizations"
 color="cyan"
 />
 <AdminCard
 icon={FileText}
 title="Templates"
 description="Inspection templates"
 path="/admin/templates"
 color="orange"
 />
 <AdminCard
 icon={BarChart3}
 title="Reports"
 description="Analytics & reports"
 path="/admin/reports"
 color="red"
 count={stats?.totalInspections}
 />
 </div>
 </div>
 )}

 {/* System Overview */}
 <div className={isAdmin ? 'lg:col-span-1' : 'lg:col-span-3 lg:max-w-md lg:mx-auto'}>
 <Card className="bg-white/8 backdrop-blur-md border border-white/10 shadow-lg shadow-blue-500/5 ring-1 ring-white/5 lg:h-[90%] lg:self-end" padding="none">
 <div className="px-3 py-2 lg:px-4 lg:py-3 border-b border-white/10">
 <div className="flex items-center gap-1.5 lg:gap-2">
 <Activity className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" />
 <h3 className="font-semibold text-white text-xs lg:text-base">System Overview</h3>
 </div>
 </div>
 <div className="divide-y divide-white/10 lg:divide-y-0 lg:divide-x lg:flex lg:flex-col">
 <div className="flex items-center justify-between px-3 py-2 lg:px-4 lg:py-3">
 <span className="text-[11px] lg:text-sm text-white/60">Total Inspections</span>
 <span className="text-xs lg:text-base font-bold text-white">{stats?.totalInspections || 0}</span>
 </div>
 <div className="flex items-center justify-between px-3 py-2 lg:px-4 lg:py-3">
 <span className="text-[11px] lg:text-sm text-white/60">Active Locations</span>
 <span className="text-xs lg:text-base font-bold text-white">{stats?.totalLocations || 0}</span>
 </div>
 <div className="flex items-center justify-between px-3 py-2 lg:px-4 lg:py-3">
 <span className="text-[11px] lg:text-sm text-white/60">Today's Activity</span>
 <span className="text-xs lg:text-base font-bold text-white">{stats?.todayInspections || 0}</span>
 </div>
 </div>
 </Card>
 </div>
 </div>
 </div>

 {/* Bottom Nav - mobile only */}
 <div className="lg:hidden">
 <BottomNav />
 </div>
 </div>
 );
};
