// src/pages/ReportsPage.tsx - Polished UI
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useMonthlyInspections, useDateInspections, InspectionReport } from '../hooks/useReports';
import { CalendarView } from '../components/reports/CalendarView';
import { InspectionDrawer } from '../components/reports/InspectionDrawer';
import { InspectionDetailModal } from '../components/reports/InspectionDetailModal';
import { Sidebar } from '../components/mobile/Sidebar';
import { BottomNav } from '../components/mobile/BottomNav';
import { TrendingUp, FileText, Menu, Download, Users, FileDown, Building2, ChevronDown, BarChart3, Info } from 'lucide-react';
import { exportToCSV, type ExportInspectionData } from '../lib/exportUtils';
import { generateMonthlyReport } from '../lib/pdfGenerator';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useBuildings } from '../hooks/useBuildings';

export const ReportsPage = () => {
 const { user } = useAuth();
 const { isAdmin, isSuperAdmin, loading: adminLoading } = useIsAdmin();

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
 const [datePage, setDatePage] = useState(1);
 const [exportMenuOpen, setExportMenuOpen] = useState(false);
 const exportMenuRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
 setExportMenuOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);
 useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
    setExportMenuOpen(false);
   }
   if (buildingDropdownRef.current && !buildingDropdownRef.current.contains(e.target as Node)) {
    setBuildingDropdownOpen(false);
   }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);


 const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);
const buildingDropdownRef = useRef<HTMLDivElement>(null);

 const { data: buildings, isLoading: buildingsLoading } = useBuildings({
 enabled: true,
 });

 const filterUserId = isAdmin ? undefined : user?.id;

 console.log('📊 [ReportsPage] Fetching monthly data with filter:', {
 isAdmin,
 filterUserId: filterUserId || 'ALL USERS',
 });

 const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyInspections(
 filterUserId,
 currentDate,
 true,
 selectedBuildingId || undefined
 );

 const dateFilterUserId = isAdmin ? undefined : user?.id;

 console.log('📊 [ReportsPage] Fetching date inspections with filter:', {
 isAdmin,
 adminLoading,
 dateFilterUserId: dateFilterUserId || 'ALL USERS',
 selectedDate,
 buildingId: selectedBuildingId || 'ALL',
 });

 const { data: dateInspectionsData } = useDateInspections(
 dateFilterUserId,
 selectedDate || '',
 true,
 selectedBuildingId || undefined,
 datePage,
 10
 );
 const dateInspections = dateInspectionsData?.inspections || [];
 const datePagination = dateInspectionsData?.pagination;

 const handleDateClick = (date: string) => {
 setSelectedDate(date);
 setDatePage(1);
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

 const totalInspections = monthlyData?.reduce((sum, d) => sum + d.count, 0) || 0;
 const averageScore = monthlyData && monthlyData.length > 0
 ? Math.round(
 monthlyData.reduce((sum, d) => sum + (d.averageScore * d.count), 0) / totalInspections
 )
 : 0;

 // Active days count
 const activeDays = monthlyData?.filter(d => d.count > 0).length || 0;

 const handleExportMonth = async () => {
 if (!user?.id) return;

 toast.loading('Preparing export...');

 try {
 const month = format(currentDate, 'yyyy-MM');

 const { data: { session } } = await supabase.auth.getSession();
 const token = session?.access_token;

 if (!token) {
 throw new Error('No authentication token');
 }

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
 const monthData: any[] = result.data;

 const allInspections = monthData.flatMap(d => d.inspections || []);

 if (allInspections.length === 0) {
 toast.dismiss();
 toast.error('No inspections to export for this month');
 return;
 }

 const exportData: ExportInspectionData[] = allInspections.map((inspection: any) => ({
 inspection_id: inspection.id,
 inspection_date: inspection.inspection_date || '',
 inspection_time: inspection.inspection_time || '',
 submitted_at: '',
 overall_status: inspection.overall_status || '',
 notes: inspection.notes || '',
 user_full_name: inspection.user?.full_name || '',
 user_email: inspection.user?.email || '',
 user_phone: '',
 user_occupation: inspection.occupation?.display_name || 'N/A',
 location_name: inspection.location?.name || '',
 building_name: inspection.location?.building || '',
 organization_name: '',
 floor: inspection.location?.floor || '',
 area: '',
 section: '',
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

 const handleExportPDF = async () => {
 if (!user?.id) return;

 const loadingToast = toast.loading('Membuat laporan PDF...');

 try {
 if (!monthlyData || monthlyData.length === 0) {
 toast.dismiss(loadingToast);
 toast.error('Tidak ada data untuk diekspor');
 return;
 }

 const selectedBuilding = buildings?.find(b => b.id === selectedBuildingId);
 const siteName = selectedBuilding?.name || 'Semua Lokasi';

 await generateMonthlyReport(
 monthlyData,
 currentDate,
 'PT Prenacons Internusa',
 siteName
 );

 toast.dismiss(loadingToast);
 toast.success('✅ Laporan PDF berhasil dibuat!');
 } catch (error: any) {
 toast.dismiss(loadingToast);
 console.error('PDF Export error:', error);
 toast.error('Gagal membuat PDF: ' + error.message);
 }
 };

 const handleExportAllUsers = async () => {
 if (!user?.id || !isAdmin) {
 toast.error('Akses administrator diperlukan');
 return;
 }

 toast.loading('Menyiapkan ekspor untuk semua pengguna...');

 try {
 const month = format(currentDate, 'yyyy-MM');

 const { data: { session } } = await supabase.auth.getSession();
 const token = session?.access_token;

 if (!token) {
 throw new Error('No authentication token');
 }

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
 const monthData: any[] = result.data;

 const allInspections = monthData.flatMap(d => d.inspections || []);

 if (allInspections.length === 0) {
 toast.dismiss();
 toast.error('No inspections to export for this month');
 return;
 }

 const exportData: ExportInspectionData[] = allInspections.map((inspection: any) => ({
 inspection_id: inspection.id,
 inspection_date: inspection.inspection_date || '',
 inspection_time: inspection.inspection_time || '',
 submitted_at: '',
 overall_status: inspection.overall_status || '',
 notes: inspection.notes || '',
 user_full_name: inspection.user?.full_name || '',
 user_email: inspection.user?.email || '',
 user_phone: '',
 user_occupation: inspection.occupation?.display_name || 'N/A',
 location_name: inspection.location?.name || '',
 building_name: inspection.location?.building || '',
 organization_name: '',
 floor: inspection.location?.floor || '',
 area: '',
 section: '',
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

 // Only block on data loading, not role check
 // Role check happens in background, page renders immediately
 if (monthlyLoading) {
   return (
     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
       <div className="text-center">
         <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
         <p className="text-white/80 text-sm font-medium">
           Memuat laporan...
         </p>
       </div>
     </div>
   );
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-6" data-tour="reports-page">
 {/* Sidebar */}
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

 {/* Header */}
 <header className="bg-white/8 backdrop-blur-xl px-4 py-5 shadow-xl border-b border-white/10 lg:py-5">
 <div className="max-w-7xl mx-auto">
 <div className="flex items-center justify-between text-white">
 {/* Left: Menu + Title */}
 <div className="flex items-center gap-3">
 <button
 onClick={() => setSidebarOpen(true)}
 className="p-2 hover:bg-white/10 rounded-xl transition-colors"
 >
 <Menu className="w-5 h-5" />
 </button>

 {/* Mobile title */}
 <div className="lg:hidden">
 <h1 className="text-lg font-bold">Laporan</h1>
 <p className="text-xs text-blue-100">Riwayat & analitik inspeksi</p>
 </div>

 {/* Desktop: Logo + Title */}
 <div className="hidden lg:flex items-center gap-2.5">
 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center p-1">
 <BarChart3 className="w-5 h-5 text-white" />
 </div>
 <div>
 <h1 className="text-sm font-bold leading-tight text-white">Laporan</h1>
 <p className="text-[11px] text-white/50">Riwayat & analitik inspeksi</p>
 </div>
 </div>
 </div>

 {/* Right: Export dropdown - Admin only */}
 {isAdmin && (
 <div className="relative" ref={exportMenuRef}>
   <motion.button
     onClick={() => setExportMenuOpen(prev => !prev)}
     className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 lg:bg-blue-600 text-white rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm shadow-lg text-xs font-semibold whitespace-nowrap"
     whileHover={{ scale: 1.02 }}
     whileTap={{ scale: 0.98 }}
   >
     <Download className="w-3.5 h-3.5" />
     <span>Export</span>
     <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${exportMenuOpen ? 'rotate-180' : ''}`} />
   </motion.button>

 <AnimatePresence>
 {exportMenuOpen && (
 <motion.div
 initial={{ opacity: 0, y: -8, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -8, scale: 0.95 }}
 transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
 className="absolute right-0 top-full mt-2 w-52 bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/15 overflow-hidden z-50"
 >
 <div className="p-1.5">
 <button
 onClick={() => { handleExportPDF(); setExportMenuOpen(false); }}
 disabled={totalInspections === 0}
 className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/90 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >
 <div className="w-7 h-7 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
 <FileDown className="w-3.5 h-3.5 text-red-400" />
 </div>
 <div className="text-left">
 <span className="font-semibold block">Export PDF</span>
 <span className="text-[10px] text-white/60 font-normal">Laporan bulanan</span>
 </div>
 </button>
 <button
 onClick={() => { handleExportMonth(); setExportMenuOpen(false); }}
 disabled={totalInspections === 0}
 className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/90 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >
 <div className="w-7 h-7 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
 <Download className="w-3.5 h-3.5 text-green-400" />
 </div>
 <div className="text-left">
 <span className="font-semibold block">Data Saya (CSV)</span>
 <span className="text-[10px] text-white/60 font-normal">Inspeksi bulan ini</span>
 </div>
 </button>
 {isAdmin && (
 <button
 onClick={() => { handleExportAllUsers(); setExportMenuOpen(false); }}
 className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/90 hover:bg-white/10 rounded-xl transition-colors"
 >
 <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
 <Users className="w-3.5 h-3.5 text-blue-400" />
 </div>
 <div className="text-left">
 <span className="font-semibold block">Semua Pengguna</span>
 <span className="text-[10px] text-white/60 font-normal">Admin only</span>
 </div>
 </button>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )}
 </div>

 {/* Filter + Stats Section */}
 <div className="mt-3 lg:mt-4">
 {/* Building Filter */}
 <div className="mb-3 lg:mb-4">
 <div className="relative max-w-xs" ref={buildingDropdownRef}>
 <button
 onClick={() => setBuildingDropdownOpen(prev => !prev)}
 disabled={buildingsLoading}
 className="w-full flex items-center gap-2 pl-9 pr-8 py-2.5 text-sm font-semibold bg-slate-800/80 text-white border border-white/15 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 cursor-pointer backdrop-blur-md transition-all shadow-lg shadow-black/20"
 >
 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400 pointer-events-none" />
 <span className="flex-1 text-left truncate">
 {buildings?.find(b => b.id === selectedBuildingId)?.name || 'Semua Gedung'}
 </span>
 <ChevronDown className={`w-3.5 h-3.5 text-blue-400 transition-transform duration-200 ${buildingDropdownOpen ? 'rotate-180' : ''}`} />
 </button>
 <AnimatePresence>
 {buildingDropdownOpen && (
 <motion.div
 initial={{ opacity: 0, y: -8, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -8, scale: 0.95 }}
 transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
 className="absolute left-0 right-0 top-full mt-2 bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/15 overflow-hidden z-50 max-h-60 overflow-y-auto"
 >
 <div className="p-1.5">
 <button
 onClick={() => { setSelectedBuildingId(''); setBuildingDropdownOpen(false); }}
 className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-xl transition-colors ${
 selectedBuildingId === '' ? 'bg-blue-500/20 text-blue-400' : 'text-white/90 hover:bg-white/10'
 }`}
 >
 <Building2 className="w-4 h-4 flex-shrink-0" />
 <span className="font-medium">Semua Gedung</span>
 </button>
 {buildings?.filter(b => b.is_active).map((building) => (
 <button
 key={building.id}
 onClick={() => { setSelectedBuildingId(building.id); setBuildingDropdownOpen(false); }}
 className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-xl transition-colors ${
 selectedBuildingId === building.id ? 'bg-blue-500/20 text-blue-400' : 'text-white/90 hover:bg-white/10'
 }`}
 >
 <Building2 className="w-4 h-4 flex-shrink-0" />
 <span className="font-medium truncate">{building.name}</span>
 </button>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 {/* Stats Cards */}
 <div className="grid grid-cols-3 gap-2 lg:gap-3">
 {/* Total Inspections */}
 <motion.div
 className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 p-3"
 whileHover={{ scale: 1.02, y: -2 }}
 transition={{ duration: 0.2 }}
 >
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
 <FileText className="w-4 h-4 text-white" />
 </div>
 </div>
 <div className="text-2xl lg:text-xl font-extrabold text-white">
 {totalInspections}
 </div>
 <div className="text-[10px] text-white/70 font-medium mt-0.5">Inspeksi</div>
 </motion.div>

 {/* Average Score */}
 <motion.div
 className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 p-3"
 whileHover={{ scale: 1.02, y: -2 }}
 transition={{ duration: 0.2 }}
 >
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
 <TrendingUp className="w-4 h-4 text-white" />
 </div>
 </div>
 <div className="text-2xl lg:text-xl font-extrabold text-white">
 {averageScore}
 </div>
 <div className="text-[10px] text-white/70 font-medium mt-0.5">Rata-rata</div>
 </motion.div>

 {/* Active Days */}
 <motion.div
 className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 p-3"
 whileHover={{ scale: 1.02, y: -2 }}
 transition={{ duration: 0.2 }}
 >
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
 <BarChart3 className="w-4 h-4 text-white" />
 </div>
 </div>
 <div className="text-2xl lg:text-xl font-extrabold text-white">
 {activeDays}
 </div>
 <div className="text-[10px] text-white/70 font-medium mt-0.5">Hari Aktif</div>
 </motion.div>
 </div>
 </div>
 </div>
 </header>

 {/* Content */}
 <div className="max-w-7xl mx-auto px-3 lg:px-6 pt-4 lg:pt-5 space-y-3 lg:space-y-4">
 {/* Instructions Tip */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1, duration: 0.4 }}
 className="bg-white/8 backdrop-blur-sm border border-white/15 lg:border-blue-200 rounded-2xl p-3 lg:p-3.5"
 >
 <div className="flex items-start gap-3">
 <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
 <Info className="w-4 h-4 text-white" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-white lg:text-blue-200 mb-0.5">
 Ketuk tanggal untuk lihat inspeksi
 </p>
 <p className="text-[11px] text-white/70 leading-relaxed">
 Titik berwarna menunjukkan skor rata-rata:{' '}
 <span className="font-bold text-green-300 lg:text-green-300">Hijau</span> (sangat baik),{' '}
 <span className="font-bold text-yellow-300 lg:text-yellow-700">Kuning</span> (baik),{' '}
 <span className="font-bold text-red-300 lg:text-red-700">Merah</span> (perlu perbaikan)
 </p>
 </div>
 </div>
 </motion.div>

 {/* Calendar */}
 <motion.div
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2, duration: 0.4 }}
 >
 <CalendarView
 currentDate={currentDate}
 onDateChange={setCurrentDate}
 dateInspections={monthlyData || []}
 onDateClick={handleDateClick}
 />
 </motion.div>

 {/* Empty State */}
 {(!monthlyData || monthlyData.length === 0) && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.3, duration: 0.4 }}
 className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-8 text-center"
 >
 <div className="w-16 h-16 bg-white/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
 <span className="text-3xl">📅</span>
 </div>
 <h3 className="font-bold text-white mb-1.5">Belum ada inspeksi</h3>
 <p className="text-white/60 text-sm">
 Mulai inspeksi lokasi untuk melihatnya di sini
 </p>
 </motion.div>
 )}
 </div>

 {/* Bottom Drawer */}
 <InspectionDrawer
 isOpen={!!selectedDate}
 onClose={handleCloseDrawer}
 inspections={dateInspections || []}
 selectedDate={selectedDate || ''}
 pagination={datePagination}
 onPageChange={setDatePage}
 onInspectionClick={handleInspectionClick}
 />

 {/* Detail Modal */}
 <InspectionDetailModal
 isOpen={!!selectedInspection}
 onClose={handleCloseDetail}
 inspection={selectedInspection}
 />

 {/* Bottom Navigation - mobile only */}
 <div className="lg:hidden">
 <BottomNav />
 </div>
 </div>
 );
};
