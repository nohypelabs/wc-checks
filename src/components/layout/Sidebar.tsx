// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Home,
 QrCode,
 MapPin,
 Calendar,
 BarChart3,
 User,
 Settings,
 LogOut,
 Menu,
 X,
 ChevronRight,
 Shield,
 FileCode,
 Droplets
} from 'lucide-react';
import { clsx } from 'clsx';
import { backdropFade, TAP_TRANSITION, SPRINGS } from '../../lib/animations';
import { LogoutModal } from '../modals/LogoutModal';

interface NavItem {
 id: string;
 label: string;
 icon: typeof Home;
 path: string;
 badge?: number;
 adminOnly?: boolean;
}

interface SidebarProps {
 className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
 const navigate = useNavigate();
 const location = useLocation();
 const { profile, signOut } = useAuth();
 const { isAdmin, isSuperAdmin } = useIsAdmin();
 const [isOpen, setIsOpen] = useState(false);
 const [isCollapsed, setIsCollapsed] = useState(false);
 const [showLogoutModal, setShowLogoutModal] = useState(false);

 // Show admin items only if user is admin or superadmin
 const showAdminItems = isAdmin || isSuperAdmin;

 // Close sidebar on route change (mobile)
 useEffect(() => {
 setIsOpen(false);
 }, [location.pathname]);

 // Close on escape key
 useEffect(() => {
 const handleEscape = (e: KeyboardEvent) => {
 if (e.key === 'Escape') setIsOpen(false);
 };
 window.addEventListener('keydown', handleEscape);
 return () => window.removeEventListener('keydown', handleEscape);
 }, []);

 const mainNavItems: NavItem[] = [
 { id: 'home', label: 'Dashboard', icon: Home, path: '/' },
 { id: 'scan', label: 'Scan QR', icon: QrCode, path: '/scan' },
 { id: 'locations', label: 'Locations', icon: MapPin, path: '/locations' },
 { id: 'reports', label: 'Reports', icon: Calendar, path: '/reports' },
 { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
 ];

 const adminNavItems: NavItem[] = [
 { id: 'admin', label: 'Admin Panel', icon: Shield, path: '/admin', adminOnly: true },
 { id: 'qr-gen', label: 'QR Generator', icon: FileCode, path: '/admin/qr-generator', adminOnly: true },
 ];

 const handleNavClick = (path: string) => {
 navigate(path);
 };

 const handleSignOut = () => {
 setShowLogoutModal(true);
 };

 const confirmSignOut = async () => {
 setShowLogoutModal(false);
 await signOut();
 navigate('/login');
 };

 const NavItemComponent = ({ item }: { item: NavItem }) => {
 const isActive = location.pathname === item.path;
 const Icon = item.icon;

 return (
 <motion.button
 onClick={() => handleNavClick(item.path)}
 className={clsx(
 'w-full flex items-center gap-3 px-4 py-3 rounded-xl relative overflow-hidden group',
 isActive
 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
 : 'text-gray-700 hover:bg-gray-100',
 isCollapsed && 'justify-center px-2'
 )}
 whileHover={{
 scale: 1.02,
 x: isActive ? 0 : 4,
 transition: { type: 'spring', stiffness: 400, damping: 25 }
 }}
 whileTap={{
 scale: 0.97,
 transition: { type: 'spring', stiffness: 500, damping: 30 }
 }}
 layout
 layoutId={isActive ? 'active-nav' : undefined}
 >
 {/* Ripple effect on click */}
 {!isActive && (
 <motion.div
 className="absolute inset-0 bg-blue-500/10 rounded-xl"
 initial={{ scale: 0, opacity: 0 }}
 whileTap={{ scale: 2, opacity: [0, 1, 0] }}
 transition={{ duration: 0.4 }}
 />
 )}

 {/* Active indicator bar */}
 {isActive && (
 <motion.div
 layoutId="active-indicator"
 className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
 initial={false}
 transition={{ type: 'spring', stiffness: 350, damping: 30 }}
 />
 )}

 <motion.div
 animate={{
 rotate: isActive ? [0, -10, 10, -10, 0] : 0,
 scale: isActive ? [1, 1.1, 1] : 1
 }}
 transition={{
 duration: 0.5,
 ease: 'easeInOut'
 }}
 >
 <Icon className={clsx('flex-shrink-0 relative z-10', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
 </motion.div>

 <AnimatePresence mode="wait">
 {!isCollapsed && (
 <motion.div
 key="nav-content"
 className="flex items-center gap-2 flex-1"
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -10 }}
 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
 >
 <span className="font-medium flex-1 text-left relative z-10">{item.label}</span>
 {item.badge && item.badge > 0 && (
 <motion.span
 initial={{ scale: 0, rotate: -180 }}
 animate={{ scale: 1, rotate: 0 }}
 exit={{ scale: 0, rotate: 180 }}
 transition={{ type: 'spring', stiffness: 400, damping: 20 }}
 className={clsx(
 'px-2 py-0.5 rounded-full text-xs font-semibold relative z-10',
 isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
 )}
 >
 {item.badge}
 </motion.span>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </motion.button>
 );
 };

 return (
 <>
 {/* Mobile Toggle Button */}
 <motion.button
 onClick={() => setIsOpen(true)}
 className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center"
 whileHover={{
 scale: 1.05,
 rotate: 90,
 transition: { type: 'spring', stiffness: 400, damping: 20 }
 }}
 whileTap={{
 scale: 0.95,
 transition: { type: 'spring', stiffness: 500, damping: 30 }
 }}
 animate={{
 rotate: isOpen ? 90 : 0
 }}
 transition={{
 type: 'spring',
 stiffness: 300,
 damping: 25
 }}
 >
 <Menu className="w-5 h-5 text-gray-700" />
 </motion.button>

 {/* Backdrop Overlay (Mobile) */}
 <AnimatePresence>
 {isOpen && (
 <motion.div
 {...backdropFade}
 className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
 onClick={() => setIsOpen(false)}
 />
 )}
 </AnimatePresence>

 {/* Sidebar */}
 <motion.aside
 initial={false}
 animate={{
 x: isOpen ? 0 : '-100%',
 width: isCollapsed ? 80 : 288, // 20rem = 80px collapsed, 72rem = 288px expanded
 }}
 transition={{
 x: SPRINGS.smooth, // Mobile slide in/out - keep fast
 width: {
 type: 'spring',
 stiffness: 180,
 damping: 26,
 mass: 0.8,
 }, // Slower, smoother collapse/expand
 }}
 className={clsx(
 'fixed top-0 left-0 h-full bg-white shadow-xl z-50 flex flex-col',
 'lg:translate-x-0', // Desktop always visible
 className
 )}
 >
 {/* Header */}
 <div className="p-4 border-b border-gray-200">
 <div className="flex items-center justify-between">
 <AnimatePresence mode="wait">
 {!isCollapsed && (
 <motion.div
 key="header-content"
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
 className="flex items-center gap-3"
 >
 <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
 <Droplets className="w-6 h-6 text-white" />
 </div>
 <div>
 <h1 className="font-bold text-gray-900">ToiletCheck</h1>
 <p className="text-xs text-gray-500">Monitoring System</p>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Close/Collapse Buttons */}
 <div className="flex items-center gap-1">
 <motion.button
 onClick={() => setIsCollapsed(!isCollapsed)}
 className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 transition={TAP_TRANSITION}
 >
 <motion.div
 animate={{ rotate: isCollapsed ? 180 : 0 }}
 transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
 >
 <ChevronRight className="w-4 h-4" />
 </motion.div>
 </motion.button>
 <motion.button
 onClick={() => setIsOpen(false)}
 className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
 whileHover={{ scale: 1.05, rotate: 90 }}
 whileTap={{ scale: 0.95 }}
 transition={TAP_TRANSITION}
 >
 <X className="w-5 h-5" />
 </motion.button>
 </div>
 </div>
 </div>

 {/* User Profile Section */}
 <div className={clsx(
 'p-4 border-b border-gray-200',
 isCollapsed && 'p-2'
 )}>
 {isCollapsed ? (
 <div className="w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
 <User className="w-5 h-5 text-blue-600" />
 </div>
 ) : (
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
 {profile?.profile_photo_url ? (
 <img
 src={profile.profile_photo_url}
 alt={profile.full_name}
 className="w-full h-full rounded-full object-cover"
 />
 ) : (
 <User className="w-6 h-6 text-blue-600" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-semibold text-gray-900 truncate">
 {profile?.full_name || 'User'}
 </h3>
 <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
 </div>
 </div>
 )}
 </div>

 {/* Navigation */}
 <nav className="flex-1 overflow-y-auto p-4 space-y-1">
 {/* Main Navigation */}
 <motion.div
 className="space-y-1"
 initial="hidden"
 animate="visible"
 variants={{
 visible: {
 transition: {
 staggerChildren: 0.05
 }
 }
 }}
 >
 {!isCollapsed && (
 <motion.div
 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3 }}
 >
 Main Menu
 </motion.div>
 )}
 {mainNavItems.map((item, index) => (
 <motion.div
 key={item.id}
 variants={{
 hidden: { opacity: 0, x: -20 },
 visible: { opacity: 1, x: 0 }
 }}
 transition={{
 type: 'spring',
 stiffness: 300,
 damping: 24,
 delay: index * 0.05
 }}
 >
 <NavItemComponent item={item} />
 </motion.div>
 ))}
 </motion.div>

 {/* Admin Section - Only show for admins */}
 {showAdminItems && adminNavItems.length > 0 && (
 <motion.div
 className="mt-6 space-y-1"
 initial="hidden"
 animate="visible"
 variants={{
 visible: {
 transition: {
 staggerChildren: 0.05,
 delayChildren: mainNavItems.length * 0.05
 }
 }
 }}
 >
 {!isCollapsed && (
 <motion.div
 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3 }}
 >
 Admin
 </motion.div>
 )}
 {adminNavItems.map((item) => (
 <motion.div
 key={item.id}
 variants={{
 hidden: { opacity: 0, x: -20 },
 visible: { opacity: 1, x: 0 }
 }}
 transition={{
 type: 'spring',
 stiffness: 300,
 damping: 24
 }}
 >
 <NavItemComponent item={item} />
 </motion.div>
 ))}
 </motion.div>
 )}
 </nav>

 {/* Bottom Actions */}
 <div className={clsx('p-4 border-t border-gray-200 space-y-2', isCollapsed && 'p-2')}>
 {/* Profile Button */}
 <motion.button
 onClick={() => handleNavClick('/profile')}
 className={clsx(
 'w-full flex items-center gap-3 px-4 py-3 rounded-xl relative overflow-hidden',
 'text-gray-700 hover:bg-gray-100',
 location.pathname === '/profile' && 'bg-gray-100',
 isCollapsed && 'justify-center px-2'
 )}
 whileHover={{
 scale: 1.02,
 x: 2,
 transition: { type: 'spring', stiffness: 400, damping: 25 }
 }}
 whileTap={{
 scale: 0.97,
 transition: { type: 'spring', stiffness: 500, damping: 30 }
 }}
 >
 {/* Ripple effect */}
 <motion.div
 className="absolute inset-0 bg-gray-500/10 rounded-xl"
 initial={{ scale: 0, opacity: 0 }}
 whileTap={{ scale: 2, opacity: [0, 1, 0] }}
 transition={{ duration: 0.4 }}
 />
 <motion.div
 whileHover={{ rotate: 90 }}
 transition={{ type: 'spring', stiffness: 300, damping: 20 }}
 >
 <Settings className={clsx('flex-shrink-0 relative z-10', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
 </motion.div>
 {!isCollapsed && <span className="font-medium relative z-10">Settings</span>}
 </motion.button>

 {/* Logout Button */}
 <motion.button
 onClick={handleSignOut}
 className={clsx(
 'w-full flex items-center gap-3 px-4 py-3 rounded-xl relative overflow-hidden',
 'text-red-600 hover:bg-red-50',
 isCollapsed && 'justify-center px-2'
 )}
 whileHover={{
 scale: 1.02,
 x: 2,
 backgroundColor: 'rgba(254, 226, 226, 0.5)', // red-50 on hover
 transition: { type: 'spring', stiffness: 400, damping: 25 }
 }}
 whileTap={{
 scale: 0.97,
 transition: { type: 'spring', stiffness: 500, damping: 30 }
 }}
 >
 {/* Ripple effect */}
 <motion.div
 className="absolute inset-0 bg-red-500/10 rounded-xl"
 initial={{ scale: 0, opacity: 0 }}
 whileTap={{ scale: 2, opacity: [0, 1, 0] }}
 transition={{ duration: 0.4 }}
 />
 <motion.div
 whileHover={{ x: 2 }}
 transition={{ type: 'spring', stiffness: 300, damping: 20 }}
 >
 <LogOut className={clsx('flex-shrink-0 relative z-10', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
 </motion.div>
 {!isCollapsed && <span className="font-medium relative z-10">Logout</span>}
 </motion.button>
 </div>
 </motion.aside>

 {/* Spacer for desktop layout */}
 <motion.div
 className="hidden lg:block flex-shrink-0"
 animate={{
 width: isCollapsed ? 80 : 288
 }}
 transition={{
 type: 'spring',
 stiffness: 180,
 damping: 26,
 mass: 0.8,
 }}
 />

 {/* Logout Modal */}
 <LogoutModal
 isOpen={showLogoutModal}
 onClose={() => setShowLogoutModal(false)}
 onConfirm={confirmSignOut}
 userName={profile?.full_name}
 />
 </>
 );
 };