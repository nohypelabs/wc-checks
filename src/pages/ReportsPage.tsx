// src/pages/ReportsPage.tsx - WITH SIDEBAR
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useMonthlyInspections, useDateInspections, InspectionReport } from '../hooks/useReports';
import { CalendarView } from '../components/reports/CalendarView';
import { InspectionDrawer } from '../components/reports/InspectionDrawer';
import { InspectionDetailModal } from '../components/reports/InspectionDetailModal';
import { Sidebar } from '../components/mobile/Sidebar';
import { BottomNav } from '../components/mobile/BottomNav';
import { Calendar, TrendingUp, FileText, Menu, Download, Users, FileDown } from 'lucide-react';
import { exportToCSV, type ExportInspectionData } from '../lib/exportUtils';
import { generateMonthlyReport } from '../lib/pdfGenerator';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ReportsPage = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, loading: adminLoading } = useIsAdmin();

  // 🔍 DEBUG: Log role status
  console.log('📊 [ReportsPage] Role check:', {
    userId: user?.id,
    isAdmin,
    isSuperAdmin,
    adminLoading,
    willFetchAllUsers: isAdmin,
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionReport | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch monthly data
  // Admin sees ALL inspections (undefined), regular users see only their own (user.id)
  const filterUserId = isAdmin ? undefined : user?.id;

  console.log('📊 [ReportsPage] Fetching monthly data with filter:', {
    isAdmin,
    filterUserId: filterUserId || 'ALL USERS',
  });

  // ✅ FIX: Only fetch after admin check completes to ensure correct filter
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyInspections(
    filterUserId,
    currentDate,
    !adminLoading  // Wait for admin check to complete
  );

  // Fetch specific date data when date is selected
  // Admin sees ALL inspections (undefined), regular users see only their own (user.id)
  const dateFilterUserId = isAdmin ? undefined : user?.id;

  console.log('📊 [ReportsPage] Fetching date inspections with filter:', {
    isAdmin,
    adminLoading,
    dateFilterUserId: dateFilterUserId || 'ALL USERS',
    selectedDate,
  });

  // ✅ FIX: Only fetch after admin check completes
  const { data: dateInspections } = useDateInspections(
    dateFilterUserId,
    selectedDate || '',
    !adminLoading  // Wait for admin check to complete
  );

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  const handleCloseDrawer = () => {
    setSelectedDate(null);
  };

  const handleInspectionClick = (inspection: InspectionReport) => {
    setSelectedInspection(inspection);
  };

  const handleCloseDetail = () => {
    setSelectedInspection(null);
  };

  // Calculate stats
  const totalInspections = monthlyData?.reduce((sum, d) => sum + d.count, 0) || 0;
  const averageScore = monthlyData && monthlyData.length > 0
    ? Math.round(
        monthlyData.reduce((sum, d) => sum + (d.averageScore * d.count), 0) / totalInspections
      )
    : 0;

  // ✅ Export current month's inspections via backend API
  const handleExportMonth = async () => {
    if (!user?.id) return;

    toast.loading('Preparing export...');

    try {
      const month = format(currentDate, 'yyyy-MM');

      // ✅ Use backend API instead of direct query
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      // Fetch through backend API - will only return current user's data
      const response = await fetch(`/api/reports?month=${month}&userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch' }));
        throw new Error(errorData.error || 'Failed to fetch inspections');
      }

      const result = await response.json();
      const monthData: any[] = result.data; // DateInspections[]

      // Flatten inspections from all dates
      const allInspections = monthData.flatMap(d => d.inspections || []);

      if (allInspections.length === 0) {
        toast.dismiss();
        toast.error('No inspections to export for this month');
        return;
      }

      // Format data for export
      const exportData: ExportInspectionData[] = allInspections.map((inspection: any) => ({
        inspection_id: inspection.id,
        inspection_date: inspection.inspection_date || '',
        inspection_time: inspection.inspection_time || '',
        submitted_at: '', // Not returned by API, keep empty
        overall_status: inspection.overall_status || '',
        notes: inspection.notes || '',
        user_full_name: inspection.user?.full_name || '',
        user_email: inspection.user?.email || '',
        user_phone: '', // Not returned by API
        user_occupation: inspection.occupation?.display_name || 'N/A',
        location_name: inspection.location?.name || '',
        building_name: inspection.location?.building || '',
        organization_name: '', // Not in current API response
        floor: inspection.location?.floor || '',
        area: '', // Not in current API response
        section: '', // Not in current API response
        photo_urls: (inspection.photo_urls || []).join('; '),
        responses: JSON.stringify(inspection.responses || {}),
      }));

      toast.dismiss();
      exportToCSV(exportData, `inspections_${month}.csv`);
      toast.success(`✅ Berhasil mengekspor ${exportData.length} inspeksi`);
    } catch (error: any) {
      toast.dismiss();
      console.error('Export error:', error);
      toast.error('Gagal mengekspor: ' + error.message);
    }
  };

  // ✅ Export PDF Report
  const handleExportPDF = async () => {
    if (!user?.id) return;

    const loadingToast = toast.loading('Membuat laporan PDF...');

    try {
      // Use monthlyData that's already loaded
      if (!monthlyData || monthlyData.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      // Generate PDF with current data
      await generateMonthlyReport(
        monthlyData,
        currentDate,
        'PT Prenacons Internusa',
        'Semua Lokasi'
      );

      toast.dismiss(loadingToast);
      toast.success('✅ Laporan PDF berhasil dibuat!');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('PDF Export error:', error);
      toast.error('Gagal membuat PDF: ' + error.message);
    }
  };

  // ✅ ADMIN ONLY (level 80+): Export ALL users' inspections for current month
  const handleExportAllUsers = async () => {
    if (!user?.id || !isAdmin) {
      toast.error('Akses administrator diperlukan');
      return;
    }

    toast.loading('Menyiapkan ekspor untuk semua pengguna...');

    try {
      const month = format(currentDate, 'yyyy-MM');

      // ✅ Use backend API - admin can fetch ALL users' data by not passing userId
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      // Fetch ALL users' data through backend API (no userId param = ALL)
      const response = await fetch(`/api/reports?month=${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch' }));
        throw new Error(errorData.error || 'Failed to fetch inspections');
      }

      const result = await response.json();
      const monthData: any[] = result.data; // DateInspections[]

      // Flatten inspections from all dates
      const allInspections = monthData.flatMap(d => d.inspections || []);

      if (allInspections.length === 0) {
        toast.dismiss();
        toast.error('No inspections to export for this month');
        return;
      }

      // Format data for export
      const exportData: ExportInspectionData[] = allInspections.map((inspection: any) => ({
        inspection_id: inspection.id,
        inspection_date: inspection.inspection_date || '',
        inspection_time: inspection.inspection_time || '',
        submitted_at: '', // Not returned by API, keep empty
        overall_status: inspection.overall_status || '',
        notes: inspection.notes || '',
        user_full_name: inspection.user?.full_name || '',
        user_email: inspection.user?.email || '',
        user_phone: '', // Not returned by API
        user_occupation: inspection.occupation?.display_name || 'N/A',
        location_name: inspection.location?.name || '',
        building_name: inspection.location?.building || '',
        organization_name: '', // Not in current API response
        floor: inspection.location?.floor || '',
        area: '', // Not in current API response
        section: '', // Not in current API response
        photo_urls: (inspection.photo_urls || []).join('; '),
        responses: JSON.stringify(inspection.responses || {}),
      }));

      toast.dismiss();
      exportToCSV(exportData, `SEMUA_INSPEKSI_${month}.csv`);
      toast.success(`✅ Berhasil mengekspor ${exportData.length} inspeksi dari semua pengguna`);
    } catch (error: any) {
      toast.dismiss();
      console.error('Export error:', error);
      toast.error('Gagal mengekspor: ' + error.message);
    }
  };

  // ✅ FIX: Show loading while admin check OR monthly data is loading
  if (adminLoading || monthlyLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">
            {adminLoading ? 'Memeriksa hak akses...' : 'Memuat laporan...'}
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
              <h1 className="text-xl font-bold text-gray-900">Laporan</h1>
              <p className="text-sm text-gray-500">Riwayat & analitik inspeksi</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-md text-xs"
              disabled={totalInspections === 0}
            >
              <FileDown className="w-4 h-4" />
              <span className="font-medium">Export PDF</span>
            </button>
            <button
              onClick={handleExportMonth}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md text-xs"
              disabled={totalInspections === 0}
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Data Saya</span>
            </button>
            {isAdmin && (
              <button
                onClick={handleExportAllUsers}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md text-xs"
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">Semua Pengguna</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards - White Theme */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-500">Bulan Ini</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalInspections}
            </div>
            <div className="text-xs text-gray-500 mt-1">Inspeksi</div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Rata-rata</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {averageScore}
            </div>
            <div className="text-xs text-gray-500 mt-1">Skor</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Ketuk tanggal untuk lihat inspeksi
              </p>
              <p className="text-xs text-blue-700">
                Titik berwarna menunjukkan skor rata-rata:
                <span className="font-semibold"> Hijau</span> (sangat baik),
                <span className="font-semibold"> Kuning</span> (baik),
                <span className="font-semibold"> Merah</span> (perlu perbaikan)
              </p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <CalendarView
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          dateInspections={monthlyData || []}
          onDateClick={handleDateClick}
        />

        {/* Empty State */}
        {(!monthlyData || monthlyData.length === 0) && (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="font-bold text-gray-900 mb-2">Belum ada inspeksi</h3>
            <p className="text-gray-600 text-sm">
              Mulai inspeksi lokasi untuk melihatnya di sini
            </p>
          </div>
        )}
      </div>

      {/* Bottom Drawer */}
      <InspectionDrawer
        isOpen={!!selectedDate}
        onClose={handleCloseDrawer}
        inspections={dateInspections || []}
        selectedDate={selectedDate || ''}
        onInspectionClick={handleInspectionClick}
      />

      {/* Detail Modal */}
      <InspectionDetailModal
        isOpen={!!selectedInspection}
        onClose={handleCloseDetail}
        inspection={selectedInspection}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};