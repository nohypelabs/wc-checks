// src/components/mobile/BottomNavFixed.tsx - Fixed Bottom Navigation
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, QrCode, MapPin, User } from 'lucide-react';
import { clsx } from 'clsx';
import { ScanModal } from './ScanModal';
import { useHaptic } from '../../hooks/useHaptic';

interface NavItem {
 id: string;
 icon: typeof Home;
 label: string;
 path: string;
 isCenter?: boolean;
}

const navItems: NavItem[] = [
 {
 id: 'home',
 icon: Home,
 label: 'Beranda',
 path: '/'
 },
 {
 id: 'history',
 icon: Calendar,
 label: 'Riwayat',
 path: '/history'
 },
 {
 id: 'scan',
 icon: QrCode,
 label: 'Pindai',
 path: '/scan',
 isCenter: true
 },
 {
 id: 'locations',
 icon: MapPin,
 label: 'Lokasi',
 path: '/locations'
 },
 {
 id: 'profile',
 icon: User,
 label: 'Profil',
 path: '/profile'
 },
];

export const BottomNav = () => {
 const navigate = useNavigate();
 const location = useLocation();
 const [scanModalOpen, setScanModalOpen] = useState(false);
 const haptic = useHaptic();

 const handleScanSuccess = (locationId: string) => {
 setScanModalOpen(false);
 navigate(`/inspect/${locationId}`);
 };

 return (
 <>
 {/* Telegram-style Floating Bottom Nav */}
 <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom pointer-events-none">
 <div className="flex items-center justify-center relative px-6 pb-2">
 <div className="flex items-center justify-around max-w-md w-[85%] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-black/10 border border-gray-200/30 px-3 py-0.5 pointer-events-auto">
 {navItems.map((item) => {
 const Icon = item.icon;
 const isActive = location.pathname === item.path ||
 (item.path !== '/' && location.pathname.startsWith(item.path));

 // Center Floating Action Button (FAB) - Telegram Style
 if (item.isCenter) {
 return (
 <div key={item.id} className="flex-1 flex justify-center">
 <button
 onClick={() => {
 haptic.medium();
 setScanModalOpen(true);
 }}
 className="
 w-14 h-14
 bg-gradient-to-br from-blue-500 to-blue-600
 rounded-2xl
 flex items-center justify-center
 text-white
 shadow-lg shadow-blue-500/30
 transition-all duration-200
 active:scale-95
 hover:shadow-xl hover:shadow-blue-500/40
 hover:from-blue-600 hover:to-blue-700
 "
 aria-label={item.label}
 >
 <Icon className="w-6 h-6" strokeWidth={2.5} />
 </button>
 </div>
 );
 }

 // Regular Nav Items
 return (
 <button
 key={item.id}
 onClick={() => {
 haptic.light();
 navigate(item.path);
 }}
 className={clsx(
 'flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200',
 isActive
 ? 'text-blue-600'
 : 'text-gray-500 hover:text-gray-700 active:scale-95'
 )}
 aria-label={item.label}
 >
 <div className={clsx(
 'relative',
 isActive && 'scale-110'
 )}>
 <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
 
 {/* Active Dot Indicator */}
 {isActive && (
 <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
 )}
 </div>
 
 <span className={clsx(
 'text-[11px] font-medium',
 isActive ? 'text-blue-600' : 'text-gray-600'
 )}>
 {item.label}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 </nav>

 {/* Scanner Modal */}
 <ScanModal
 isOpen={scanModalOpen}
 onClose={() => setScanModalOpen(false)}
 onScan={handleScanSuccess}
 />
 </>
 );
};

// Alternative: Minimal Bottom Nav (tanpa FAB, semua flat)
export const BottomNavMinimal = () => {
 const navigate = useNavigate();
 const location = useLocation();
 const haptic = useHaptic();

 const minimalItems = [
 { icon: Home, label: 'Beranda', path: '/' },
 { icon: Calendar, label: 'Riwayat', path: '/history' },
 { icon: QrCode, label: 'Pindai', path: '/scan' },
 { icon: MapPin, label: 'Lokasi', path: '/locations' },
 { icon: User, label: 'Profil', path: '/profile' },
 ];

 return (
 <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
 <div className="flex items-center justify-around py-1">
 {minimalItems.map((item, index) => {
 const Icon = item.icon;
 const isActive = location.pathname === item.path || 
 (item.path !== '/' && location.pathname.startsWith(item.path));

 return (
 <button
 key={index}
 onClick={() => {
 haptic.light();
 navigate(item.path);
 }}
 className={clsx(
 'flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all min-w-[60px]',
 isActive
 ? 'text-blue-600 bg-blue-50'
 : 'text-gray-500'
 )}
 >
 <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
 <span className="text-[10px] font-medium">{item.label}</span>
 </button>
 );
 })}
 </div>
 </nav>
 );
};

// Livin-style Bottom Nav (dengan background gradient pada active item)
export const BottomNavLivin = () => {
 const navigate = useNavigate();
 const location = useLocation();
 const haptic = useHaptic();

 const livinItems = [
 { icon: Home, label: 'Beranda', path: '/' },
 { icon: Calendar, label: 'Riwayat', path: '/history' },
 { icon: QrCode, label: 'Scan', path: '/scan', isCenter: true },
 { icon: MapPin, label: 'Lokasi', path: '/locations' },
 { icon: User, label: 'Profil', path: '/profile' },
 ];

 return (
 <nav className="fixed bottom-0 left-0 right-0 bg-white z-50 safe-area-bottom">
 <div className="flex items-center justify-around relative h-16 px-2">
 {livinItems.map((item, index) => {
 const Icon = item.icon;
 const isActive = location.pathname === item.path;

 // Center FAB ala Livin
 if (item.isCenter) {
 return (
 <div key={index} className="flex-1 flex justify-center">
 <button
 onClick={() => {
 haptic.medium();
 navigate(item.path);
 }}
 className="
 w-16 h-16
 bg-gradient-to-br from-cyan-500 to-blue-600
 rounded-full
 flex items-center justify-center
 text-white
 shadow-2xl shadow-blue-500/40
 -mt-8
 border-4 border-white
 transition-transform duration-200
 active:scale-90
 "
 >
 <Icon className="w-8 h-8" strokeWidth={2.5} />
 </button>
 <span className="absolute bottom-1 text-[10px] font-medium text-gray-600">
 {item.label}
 </span>
 </div>
 );
 }

 return (
 <button
 key={index}
 onClick={() => {
 haptic.light();
 navigate(item.path);
 }}
 className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
 >
 <div className={clsx(
 'flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all',
 isActive && 'bg-gradient-to-br from-blue-50 to-cyan-50'
 )}>
 <Icon 
 className={clsx(
 'w-6 h-6 transition-colors',
 isActive ? 'text-blue-600' : 'text-gray-400'
 )} 
 strokeWidth={isActive ? 2.5 : 2} 
 />
 <span className={clsx(
 'text-[10px] font-medium transition-colors',
 isActive ? 'text-blue-600' : 'text-gray-500'
 )}>
 {item.label}
 </span>
 </div>
 </button>
 );
 })}
 </div>
 </nav>
 );
};

export default BottomNav;