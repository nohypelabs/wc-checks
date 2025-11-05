// src/pages/SettingsPage.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Globe, Moon, Download, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BottomNav } from '../components/mobile/BottomNav';
import { useAuth } from '../hooks/useAuth';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
            <p className="text-sm text-gray-500">Preferensi aplikasi</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-5 space-y-4">
        {/* Appearance */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-3">Tampilan</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Mode Gelap</p>
                  <p className="text-xs text-gray-500">Segera hadir</p>
                </div>
              </div>
              <div className="text-sm text-gray-400">Tidak Aktif</div>
            </button>

            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Bahasa</p>
                  <p className="text-xs text-gray-500">Pilih bahasa aplikasi</p>
                </div>
              </div>
              <div className="text-sm text-blue-600">Bahasa Indonesia</div>
            </button>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-3">Notifikasi</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Notifikasi Push</p>
                  <p className="text-xs text-gray-500">Pengingat inspeksi</p>
                </div>
              </div>
              <div className="text-sm text-gray-400">Tidak Aktif</div>
            </button>
          </div>
        </Card>

        {/* Data & Storage */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-3">Data & Penyimpanan</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Ekspor Data</p>
                  <p className="text-xs text-gray-500">Unduh semua data Anda</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <p className="font-medium text-red-600">Hapus Cache</p>
                  <p className="text-xs text-gray-500">Bersihkan data temporary</p>
                </div>
              </div>
            </button>
          </div>
        </Card>

        {/* App Info */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-3">Informasi Aplikasi</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Versi</span>
              <span className="font-medium text-gray-900">3.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900 truncate ml-4">{user?.email}</span>
            </div>
          </div>
        </Card>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-sm text-blue-700">
            💡 Fitur pengaturan lanjutan akan segera hadir
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
