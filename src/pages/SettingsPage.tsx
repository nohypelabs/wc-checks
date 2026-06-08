import { useState } from 'react';
// src/pages/SettingsPage.tsx
import { Menu, Bell, Globe, Moon, Download, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BottomNav } from '../components/mobile/BottomNav';
import { Sidebar } from '../components/mobile/Sidebar';
import { useAuth } from '../hooks/useAuth';

export const SettingsPage = () => {
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const { user } = useAuth();

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-6">
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
 {/* Header */}
 <div className="bg-white/8 backdrop-blur-xl px-3 py-5 shadow-xl border-b border-white/10 lg:py-5 lg:px-4">
 <div className="flex items-center gap-3">
 <button
 onClick={() => setSidebarOpen(true)}
 className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
 >
 <Menu className="w-5 h-5 text-white/60" />
 </button>
 <div>
 <h1 className="text-xl font-bold text-white">Pengaturan</h1>
 <p className="text-sm text-white/50">Preferensi aplikasi</p>
 </div>
 </div>
 </div>

 {/* Main Content */}
         <main className="max-w-2xl mx-auto p-5 space-y-4">
 {/* Appearance */}
 <Card>
 <h2 className="font-bold text-white mb-3">Tampilan</h2>
 <div className="space-y-3">
 <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/8 transition-colors">
 <div className="flex items-center gap-3">
 <Moon className="w-5 h-5 text-white/60" />
 <div className="text-left">
 <p className="font-medium text-white">Mode Gelap</p>
 <p className="text-xs text-white/50">Segera hadir</p>
 </div>
 </div>
 <div className="text-sm text-white/40">Tidak Aktif</div>
 </button>

 <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/8 transition-colors">
 <div className="flex items-center gap-3">
 <Globe className="w-5 h-5 text-white/60" />
 <div className="text-left">
 <p className="font-medium text-white">Bahasa</p>
 <p className="text-xs text-white/50">Pilih bahasa aplikasi</p>
 </div>
 </div>
 <div className="text-sm text-blue-300">Bahasa Indonesia</div>
 </button>
 </div>
 </Card>

 {/* Notifications */}
 <Card>
 <h2 className="font-bold text-white mb-3">Notifikasi</h2>
 <div className="space-y-3">
 <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/8 transition-colors">
 <div className="flex items-center gap-3">
 <Bell className="w-5 h-5 text-white/60" />
 <div className="text-left">
 <p className="font-medium text-white">Notifikasi Push</p>
 <p className="text-xs text-white/50">Pengingat inspeksi</p>
 </div>
 </div>
 <div className="text-sm text-white/40">Tidak Aktif</div>
 </button>
 </div>
 </Card>

 {/* Data & Storage */}
 <Card>
 <h2 className="font-bold text-white mb-3">Data & Penyimpanan</h2>
 <div className="space-y-3">
 <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/8 transition-colors">
 <div className="flex items-center gap-3">
 <Download className="w-5 h-5 text-white/60" />
 <div className="text-left">
 <p className="font-medium text-white">Ekspor Data</p>
 <p className="text-xs text-white/50">Unduh semua data Anda</p>
 </div>
 </div>
 </button>

 <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/8 transition-colors">
 <div className="flex items-center gap-3">
 <Trash2 className="w-5 h-5 text-red-300" />
 <div className="text-left">
 <p className="font-medium text-red-300">Hapus Cache</p>
 <p className="text-xs text-white/50">Bersihkan data temporary</p>
 </div>
 </div>
 </button>
 </div>
 </Card>

 {/* App Info */}
 <Card>
 <h2 className="font-bold text-white mb-3">Informasi Aplikasi</h2>
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-white/60">Versi</span>
 <span className="font-medium text-white">3.0.0</span>
 </div>
 <div className="flex justify-between">
 <span className="text-white/60">Email</span>
 <span className="font-medium text-white truncate ml-4">{user?.email}</span>
 </div>
 </div>
 </Card>

 {/* Coming Soon Notice */}
 <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
 <p className="text-sm text-blue-400">
 💡 Fitur pengaturan lanjutan akan segera hadir
 </p>
 </div>
 </main>

 <div className="lg:hidden"><div className="lg:hidden"><BottomNav /></div></div>
 </div>
 );
};
