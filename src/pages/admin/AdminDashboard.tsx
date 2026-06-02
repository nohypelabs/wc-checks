// src/pages/admin/AdminDashboard.tsx - Main Dashboard (Admin & User)
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

export const AdminDashboard = () => {
  usePerformance('HomePage');
  const { profile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 lg:bg-gradient-to-r lg:from-slate-50 lg:to-slate-100 pb-20 lg:pb-0">
      {/* Sidebar - mobile only */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg p-4 shadow-xl border-b border-white/20 lg:bg-white lg:shadow-sm lg:border-gray-200 lg:backdrop-blur-none lg:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-white lg:text-gray-900">
          {/* Left Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 lg:hover:bg-gray-100 rounded-xl transition-colors lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop: Logo left */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center p-1">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight text-gray-900">Proservice Indonesia</h1>
              <p className="text-[11px] text-gray-500">Aplikasi Toilet Ceklis Real Time</p>
            </div>
          </div>

          {/* Mobile: Centered Logo */}
          <div className="lg:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold whitespace-nowrap leading-tight">Proservice Indonesia</h1>
              <p className="text-xs text-blue-100 whitespace-nowrap">Aplikasi Toilet Ceklis Real Time</p>
            </div>
          </div>

          {/* Right: Welcome + Settings */}
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-xs text-gray-600">
              Selamat datang, {isAdmin ? 'Admin' : 'User'} <span className="font-semibold text-gray-900">{profile?.full_name?.split(' ')[0] || ''}</span>
            </span>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-white/10 lg:hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile welcome */}
        <div className="mt-2 text-center lg:hidden">
          <p className="text-sm text-blue-100">
            Selamat datang, {isAdmin ? 'Admin' : 'User'} {profile?.full_name?.split(' ')[0] || ''}
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-4 lg:pt-4">
        {/* Quick Stats - Inspection counts by period */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3 mb-4 lg:mb-4">
          <Card className="p-4 lg:p-3 bg-white shadow-xl border-0 lg:shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              {stats && stats.inspectionGrowth !== 0 && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${
                  stats.inspectionGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.inspectionGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{Math.abs(stats.inspectionGrowth)}%</span>
                </div>
              )}
            </div>
            <div className="text-2xl lg:text-lg font-bold text-gray-900">{stats?.todayInspections || 0}</div>
            <div className="text-xs text-gray-500">Inspeksi Hari Ini</div>
          </Card>

          <Card className="p-4 lg:p-3 bg-white shadow-xl border-0 lg:shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-2xl lg:text-lg font-bold text-gray-900">{stats?.inspections7d || 0}</div>
            <div className="text-xs text-gray-500">Inspeksi 7 Hari</div>
          </Card>

          <Card className="p-4 lg:p-3 bg-white shadow-xl border-0 lg:shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl lg:text-lg font-bold text-gray-900">{stats?.inspections30d || 0}</div>
            <div className="text-xs text-gray-500">Inspeksi 30 Hari</div>
          </Card>

          <Card className="p-4 lg:p-3 bg-white shadow-xl border-0 lg:shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl lg:text-lg font-bold text-gray-900">{stats?.totalInspections || 0}</div>
            <div className="text-xs text-gray-500">Total Inspeksi</div>
          </Card>
        </div>

        {/* Two column layout on desktop: Management | Overview */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-4 lg:items-end">
          {/* Management Cards - Admin Only */}
          {isAdmin && (
            <div className="mb-4 lg:mb-0 lg:col-span-2">
              <h2 className="text-lg font-bold text-white lg:text-gray-800 lg:mb-2 mb-3">Management</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-2">
                <AdminCard
                  icon={Users}
                  title="User Management"
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
                  title="Occupations"
                  description="Job titles & roles"
                  path="/admin/occupations"
                  color="purple"
                />
                <AdminCard
                  icon={Building2}
                  title="Organizations"
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
            <Card className="bg-white shadow-xl border-0 lg:shadow-sm lg:h-full" padding="none">
              <div className="px-4 py-3 lg:px-3 lg:py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">System Overview</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-50 lg:divide-y-0 lg:divide-x lg:divide-gray-100 lg:flex lg:flex-col">
                <div className="flex items-center justify-between px-4 py-3 lg:px-3 lg:py-2.5">
                  <span className="text-xs text-gray-500">Total Inspections</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.totalInspections || 0}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 lg:px-3 lg:py-2.5">
                  <span className="text-xs text-gray-500">Active Locations</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.totalLocations || 0}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 lg:px-3 lg:py-2.5">
                  <span className="text-xs text-gray-500">Today's Activity</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.todayInspections || 0}</span>
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
