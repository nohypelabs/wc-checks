// src/pages/AboutPage.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Github, Globe, Mail } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BottomNav } from '../components/mobile/BottomNav';

export const AboutPage = () => {
  const navigate = useNavigate();

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
            <h1 className="text-xl font-bold text-gray-900">Tentang Aplikasi</h1>
            <p className="text-sm text-gray-500">Informasi WC Check</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-5 space-y-4">
        {/* App Logo & Name */}
        <Card>
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🚽</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">WC Check</h2>
            <p className="text-gray-600 mb-4">Sistem Inspeksi Toilet Terintegrasi</p>
            <div className="inline-block px-4 py-2 bg-blue-50 rounded-full">
              <span className="text-sm font-medium text-blue-600">Versi 1.0.0</span>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">Tentang WC Check</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            WC Check adalah aplikasi manajemen inspeksi toilet yang membantu organisasi
            memantau dan meningkatkan standar kebersihan fasilitas sanitasi mereka
            secara real-time dengan teknologi QR code.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Dirancang untuk petugas kebersihan, supervisor, dan manajemen fasilitas
            agar dapat melakukan inspeksi dengan mudah, mencatat temuan, dan
            menghasilkan laporan komprehensif.
          </p>
        </Card>

        {/* Features */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">Fitur Utama</h3>
          <div className="space-y-3">
            {[
              'QR Code Scanner untuk inspeksi cepat',
              'Sistem penilaian komprehensif',
              'Riwayat inspeksi lengkap',
              'Analytics & reporting',
              'Export data ke CSV',
              'Offline capability (PWA)',
              'Multi-organizasi & multi-lokasi',
              'Role-based access (Admin/User)',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tech Stack */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">Teknologi</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Frontend</p>
              <p className="text-xs text-gray-500">React + TypeScript</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Backend</p>
              <p className="text-xs text-gray-500">Supabase</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Styling</p>
              <p className="text-xs text-gray-500">Tailwind CSS</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">PWA</p>
              <p className="text-xs text-gray-500">Vite PWA</p>
            </div>
          </div>
        </Card>

        {/* Links */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">Tautan</h3>
          <div className="space-y-3">
            <a
              href="https://wc-checks.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Website</p>
                <p className="text-xs text-gray-500">wc-checks.vercel.app</p>
              </div>
            </a>

            <a
              href="mailto:abdulgofur100persen@gmail.com"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-xs text-gray-500">abdulgofur100persen@gmail.com</p>
              </div>
            </a>

            <a
              href="https://github.com/agds-alt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Github className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">GitHub</p>
                <p className="text-xs text-gray-500">github.com/agds-alt</p>
              </div>
            </a>
          </div>
        </Card>

        {/* Legal */}
        <Card>
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>© 2025 WC Check. All rights reserved.</p>
            <div className="flex justify-center gap-4">
              <a href="#" className="hover:text-blue-600">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-blue-600">Terms of Service</a>
            </div>
          </div>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};
