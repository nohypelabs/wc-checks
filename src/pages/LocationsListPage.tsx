// src/pages/LocationsListPage.tsx — Compact mobile, collapsible buildings, polished UI
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { Sidebar } from '../components/mobile/Sidebar';
import { BottomNav } from '../components/mobile/BottomNav';
import {
 MapPin,
 Menu,
 Search,
 ChevronRight,
 ChevronDown,
 Building2,
 Layers,
 Plus,
 Settings,
} from 'lucide-react';

interface Location {
 id: string;
 name: string;
 building: string | null;
 floor: string | null;
 code: string | null;
 is_active: boolean;
 building_id: string | null;
}

export const LocationsListPage = () => {
 const navigate = useNavigate();
 const { user, loading: authLoading } = useAuth();
 const { isAdmin } = useIsAdmin();

 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());

 const isReady = !authLoading && !!user?.id;

 const { data: locations, isLoading } = useQuery({
 queryKey: ['locations-list'],
 queryFn: async (): Promise<Location[]> => {
 const { data, error } = await supabase
 .from('locations')
 .select(`
 id,
 name,
 floor,
 code,
 is_active,
 building_id,
 buildings!building_id (
 name
 )
 `)
 .eq('is_active', true)
 .order('name', { ascending: true });

 if (error) throw error;

 return (data || []).map((loc: any) => ({
 id: loc.id,
 name: loc.name,
 floor: loc.floor,
 code: loc.code,
 is_active: loc.is_active,
 building_id: loc.building_id,
 building: loc.buildings?.name || null,
 })) as Location[];
 },
 enabled: isReady,
 });

 const filteredLocations = locations?.filter(loc =>
 loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (loc.building?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
 (loc.floor?.toLowerCase() || '').includes(searchQuery.toLowerCase())
 ) || [];

 const groupedLocations = filteredLocations.reduce((acc, loc) => {
 const buildingKey = loc.building || 'No Building';
 if (!acc[buildingKey]) {
 acc[buildingKey] = [];
 }
 acc[buildingKey].push(loc);
 return acc;
 }, {} as Record<string, Location[]>);

 const buildingCount = Object.keys(groupedLocations).length;

 const toggleBuilding = (building: string) => {
 setExpandedBuildings(prev => {
 const next = new Set(prev);
 if (next.has(building)) {
 next.delete(building);
 } else {
 next.add(building);
 }
 return next;
 });
 };

 const handleSelectLocation = (locationId: string) => {
 navigate(`/inspect/${locationId}`);
 };

 if (authLoading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin" />
 </div>
 );
 }

 if (!user) {
 navigate('/login', { replace: true });
 return null;
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-6">
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

 {/* Header */}
 <header className="bg-white/8 backdrop-blur-xl px-3 py-2.5 shadow-xl border-b border-white/10 lg:py-3 lg:px-4">
 <div className="max-w-7xl mx-auto">
 <div className="flex items-center justify-between text-white">
 {/* Left: Menu + Title */}
 <div className="flex items-center gap-2.5">
 <button
 onClick={() => setSidebarOpen(true)}
 className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
 >
 <Menu className="w-5 h-5" />
 </button>

 {/* Mobile title */}
 <div className="lg:hidden">
 <h1 className="text-base font-bold leading-tight">Lokasi</h1>
 </div>

 {/* Desktop: Icon + Title */}
 <div className="hidden lg:flex items-center gap-2.5">
 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
 <MapPin className="w-5 h-5 text-white" />
 </div>
 <div>
 <h1 className="text-sm font-bold leading-tight text-white">Lokasi</h1>
 <p className="text-[11px] text-white/50">Pilih lokasi untuk inspeksi</p>
 </div>
 </div>
 </div>

 {/* Right: Admin actions */}
 {isAdmin && (
 <div className="flex items-center gap-1.5">
 <motion.button
 onClick={() => navigate('/locations/add')}
 className="p-2 bg-white/10 lg:bg-blue-600 text-white rounded-xl hover:bg-white/30 transition-colors"
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 >
 <Plus className="w-4 h-4" />
 </motion.button>
 <motion.button
 onClick={() => navigate('/admin/locations')}
 className="p-2 bg-white/10 lg:bg-white/15 text-white rounded-xl hover:bg-white/30 transition-colors"
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 >
 <Settings className="w-4 h-4" />
 </motion.button>
 </div>
 )}
 </div>

 {/* Search + Stats row */}
 <div className="mt-2.5 lg:mt-3 space-y-2">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
 <input
 type="text"
 placeholder="Cari lokasi..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-xs bg-white/8 text-white placeholder-white/50 lg:placeholder-gray-400 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/40 lg:focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
 />
 </div>

 {/* Inline stats */}
 {!isLoading && filteredLocations.length > 0 && (
 <div className="flex items-center gap-3 text-[10px] lg:text-xs text-white/60 font-medium">
 <span>{filteredLocations.length} lokasi</span>
 <span className="w-1 h-1 rounded-full bg-white/30 lg:bg-gray-300" />
 <span>{buildingCount} gedung</span>
 </div>
 )}
 </div>
 </div>
 </header>

 {/* Content */}
 <div className="max-w-7xl mx-auto px-3 lg:px-6 pt-3 lg:pt-4">
 {isLoading ? (
 <div className="text-center py-16">
 <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
 </div>
 ) : filteredLocations.length === 0 ? (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-8 text-center"
 >
 <div className="w-14 h-14 bg-white/8 rounded-2xl flex items-center justify-center mx-auto mb-3">
 <MapPin className="w-7 h-7 text-white/60" />
 </div>
 <h3 className="font-bold text-white mb-1">
 {searchQuery ? 'Tidak ditemukan' : 'Belum ada lokasi'}
 </h3>
 <p className="text-white/60 text-xs">
 {searchQuery ? 'Coba kata kunci lain' : 'Hubungi admin untuk menambahkan lokasi'}
 </p>
 </motion.div>
 ) : (
 <div className="space-y-2 lg:space-y-2.5">
 {Object.entries(groupedLocations).map(([building, locs], groupIdx) => {
 const isExpanded = expandedBuildings.has(building);

 return (
 <motion.div
 key={building}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: groupIdx * 0.05, duration: 0.3 }}
 className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl overflow-hidden"
 >
 {/* Building header — clickable */}
 <button
 onClick={() => toggleBuilding(building)}
 className="w-full flex items-center justify-between px-3 py-2.5 lg:px-4 lg:py-3 hover:bg-white/10 transition-colors"
 >
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
 <Building2 className="w-3.5 h-3.5 text-white" />
 </div>
 <div className="text-left">
 <span className="text-sm font-semibold text-white">{building}</span>
 <span className="text-[10px] text-white/50 ml-1.5">({locs.length})</span>
 </div>
 </div>
 <motion.div
 animate={{ rotate: isExpanded ? 180 : 0 }}
 transition={{ duration: 0.2 }}
 >
 <ChevronDown className="w-4 h-4 text-white/60" />
 </motion.div>
 </button>

 {/* Locations list — animated */}
 <AnimatePresence initial={false}>
 {isExpanded && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
 className="overflow-hidden"
 >
 <div className="px-2 pb-2 lg:px-3 lg:pb-3 space-y-1 lg:grid lg:grid-cols-2 lg:gap-1.5">
 {locs.map((location, locIdx) => (
 <motion.button
 key={location.id}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: locIdx * 0.03, duration: 0.2 }}
 onClick={() => handleSelectLocation(location.id)}
 className="w-full flex items-center gap-2.5 px-3 py-2 lg:py-2.5 rounded-xl hover:bg-white/8 active:bg-white/10 transition-colors group text-left"
 >
 <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 lg:group-hover:bg-blue-100 transition-colors">
 <MapPin className="w-4 h-4 text-white/80" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-xs font-semibold text-white truncate">
 {location.name}
 </div>
 <div className="flex items-center gap-1.5 mt-0.5">
 {location.floor && (
 <span className="text-[10px] text-white/50 flex items-center gap-0.5">
 <Layers className="w-2.5 h-2.5" />
 {location.floor}
 </span>
 )}
 {location.code && (
 <>
 {location.floor && <span className="text-white/20 lg:text-gray-300 text-[10px]">•</span>}
 <span className="text-[10px] text-white/40 font-mono">{location.code}</span>
 </>
 )}
 </div>
 </div>
 <ChevronRight className="w-3.5 h-3.5 text-white/30 lg:text-gray-300 flex-shrink-0 group-hover:text-white/60 lg:group-hover:text-white/50 transition-colors" />
 </motion.button>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
 })}
 </div>
 )}
 </div>

 {/* Bottom Navigation - mobile only */}
 <div className="lg:hidden">
 <BottomNav />
 </div>
 </div>
 );
};
