// src/pages/ReportsPage.tsx - Polished UI
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useMonthlyInspections, useDateInspections, InspectionReport } from '../hooks/useReports';
import { CalendarView } from '../components/reports/CalendarView';
import { InspectionDrawer } from '../components/reports/InspectionDrawer';
import { InspectionDetailModal } from '../components/reports/InspectionDetailModal';
import { PageLayout } from '../components/layout/PageLayout';
import { TrendingUp, FileText, Download, Users, FileDown, Building2, ChevronDown, BarChart3, Info } from 'lucide-react';
import { exportToCSV, type ExportInspectionData } from '../lib/exportUtils';
import { generateMonthlyReport } from '../lib/pdfGenerator';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

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
 const [datePage, setDatePage] = useState(1);
 const [exportMenuOpen, setExportMenuOpen] = useState(false);
 const exportMenuRef = useRef<HTMLDivElement>(null);

 const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
 const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
 const orgDropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
    setExportMenuOpen(false);
   }
   if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
    setOrgDropdownOpen(false);
   }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 // Fetch organizations for filter dropdown
 const { data: organizations = [], isLoading: orgsLoading } = useQuery({
 queryKey: ['organizations-list'],
 queryFn: async () => {
   const { data: { session } } = await supabase.auth.getSession();
   const token = session?.access_token;
   if (!token) throw new Error('No auth token');
   const res = await fetch('/api/admin/resources?type=organizations', {
     headers: { Authorization: `Bearer ${token}` },
   });
   if (!res.ok) throw new Error('Failed to fetch organizations');
   const result = await res.json();
   return (result.data || []).filter((o: any) => o.is_active);
 },
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
 selectedOrganizationId || undefined
 );

 const dateFilterUserId = isAdmin ? undefined : user?.id;

 console.log('📊 [ReportsPage] Fetching date inspections with filter:', {
 isAdmin,
 adminLoading,
 dateFilterUserId: dateFilterUserId || 'ALL USERS',
 selectedDate,
 organizationId: selectedOrganizationId || 'ALL',
 });

 const { data: dateInspectionsData } = useDateInspections(
 dateFilterUserId,
 selectedDate || '',
 true,
 selectedOrganizationId || undefined,
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

 const selectedOrg = organizations?.find((o: any) => o.id === selectedOrganizationId);
 const siteName = selectedOrg?.name || 'Semua Lokasi';

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

 // headerRight: building filter + export dropdown
 const headerRightContent = (
   <div className="flex items-center gap-2">
     {/* Organization Filter */}
     <div className="relative" ref={orgDropdownRef}>
       <button
         onClick={() => setOrgDropdownOpen(prev => !prev)}
         disabled={orgsLoading}
         className="flex items-center gap-1.5 pl-8 pr-3 py-2 text-xs font-semibold bg-slate-800/80 text-white border border-white/15 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 cursor-pointer backdrop-blur-md transition-all shadow-lg shadow-black/20"
       >
         <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400 pointer-events-none" />
         <span className="flex-1 text-left truncate max-w-[8rem]">
           {organizations?.find((o: any) => o.id === selectedOrganizationId)?.name || 'Semua Organisasi'}
         </span>
         <ChevronDown className={`w-3.5 h-3.5 text-blue-400 transition-transform duration-200 ${orgDropdownOpen ? 'rotate-180' : ''}`} />
       </button>
       <AnimatePresence>
         {orgDropdownOpen && (
           <motion.div
             initial={{ opacity: 0, y: -8, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -8, scale: 0.95 }}
             transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
             className="absolute left-0 right-0 top-full mt-2 bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/15 overflow-hidden z-50 max-h-60 overflow-y-auto"
           >
             <div className="p-1.5">
               <button
                 onClick={() => { setSelectedOrganizationId(''); setOrgDropdownOpen(false); }}
                 className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-xl transition-colors ${
                   selectedOrganizationId === '' ? 'bg-blue-500/20 text-blue-400' : 'text-white/90 hover:bg-white/10'
                 }`}
               >
                 <Building2 className="w-4 h-4 flex-shrink-0" />
                 <span className="font-medium">Semua Organisasi</span>
               </button>
               {organizations?.map((org: any) => (
                 <button
                   key={org.id}
                   onClick={() => { setSelectedOrganizationId(org.id); setOrgDropdownOpen(false); }}
                   className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-xl transition-colors ${
                     selectedOrganizationId === org.id ? 'bg-blue-500/20 text-blue-400' : 'text-white/90 hover:bg-white/10'
                   }`}
                 >
                   <Building2 className="w-4 h-4 flex-shrink-0" />
                   <span className="font-medium truncate">{org.name}</span>
                 </button>
               ))}
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     </div>

     {/* Export dropdown - Admin only */}
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
 );

 return (
 <PageLayout
   title="Laporan"
   subtitle="Riwayat & analitik inspeksi"
   headerRight={headerRightContent}
   maxWidth="max-w-7xl"
   data-tour="reports-page"
 >
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
 </PageLayout>
 );
};
