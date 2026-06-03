// src/components/mobile/Sidebar.tsx — Glassmorphism
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  MapPin,
  FileText,
  LogOut,
  Building2,
  Shield,
  Settings,
  HelpCircle,
  Info,
  BarChart3,
  Users,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const { isAdmin, isSuperAdmin } = useIsAdmin();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    const confirm = window.confirm('Apakah Anda yakin ingin keluar?');
    if (confirm) {
      await signOut();
      navigate('/login');
      onClose();
    }
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/', description: 'Beranda utama' },
    { icon: MapPin, label: 'Lokasi', path: '/locations', description: 'Daftar semua lokasi' },
    { icon: FileText, label: 'Laporan', path: '/reports', description: 'Riwayat inspeksi' },
    { icon: BarChart3, label: 'Analitik', path: '/analytics', description: 'Statistik & wawasan' },
    { icon: Settings, label: 'Pengaturan', path: '/settings', description: 'Preferensi aplikasi' },
    { icon: HelpCircle, label: 'Bantuan & FAQ', path: '/help', description: 'Panduan penggunaan' },
    { icon: Info, label: 'Tentang Aplikasi', path: '/about', description: 'Versi & informasi' },
  { icon: Tag, label: 'Changelog', path: '/changelog', description: 'Riwayat pembaruan' },
  ];

  const adminMenuItems = [
    { icon: Shield, label: 'Organisasi', path: '/admin/organizations', description: 'Kelola organisasi' },
    { icon: Building2, label: 'Gedung', path: '/admin/buildings', description: 'Kelola gedung' },
    { icon: MapPin, label: 'Kelola Lokasi', path: '/admin/locations', description: 'CRUD lokasi admin' },
  ];

  const superAdminMenuItems = [
    { icon: Users, label: 'User Management', path: '/superadmin/user-management', description: 'Manage users & roles' },
  ];

  const isActive = (path: string) => location.pathname === path;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Sidebar — Glass */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-white/8 backdrop-blur-xl z-50 shadow-2xl border-r border-white/10">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5 border border-white/30">
                <img src="/logo.png" alt="Prenacons Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl font-bold">
                {isAdmin ? 'Admin Dashboard' : 'User Dashboard'}
              </h2>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/20 rounded-xl transition-colors group"
              title="Keluar"
            >
              <LogOut className="w-5 h-5 text-white/60 group-hover:text-red-300 transition-colors" />
            </button>
          </div>

          {/* Welcome Text */}
          {profile && (
            <p className="text-blue-100 text-sm mb-4">
              Welcome back, {profile.full_name}!
            </p>
          )}

          {/* User Info */}
          {profile && (
            <div className="flex items-center gap-3 p-3 bg-white/8 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">
                  {profile.full_name}
                </div>
                <div className="text-xs text-blue-100 truncate">
                  {profile.email}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center gap-3 p-3.5 rounded-xl transition-all
                  ${active
                    ? 'bg-white/10 text-white shadow-sm border border-white/10'
                    : 'text-white/80 hover:bg-white/10'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-white/60'}`} />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  {item.description && (
                    <div className="text-[11px] text-white/50 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider px-4">
                  Administrator
                </div>
              </div>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 p-3.5 rounded-xl transition-all
                      ${active
                        ? 'bg-purple-500/20 text-purple-200 shadow-sm border border-purple-400/25'
                        : 'text-white/80 hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-purple-300' : 'text-white/60'}`} />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.label}</div>
                      {item.description && (
                        <div className="text-[11px] text-white/50 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Superadmin Section */}
          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-2">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider px-4">
                  Superadmin
                </div>
              </div>
              {superAdminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 p-3.5 rounded-xl transition-all
                      ${active
                        ? 'bg-purple-500/20 text-purple-200 shadow-sm border border-purple-400/25'
                        : 'text-white/80 hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-purple-300' : 'text-white/60'}`} />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.label}</div>
                      {item.description && (
                        <div className="text-[11px] text-white/50 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
