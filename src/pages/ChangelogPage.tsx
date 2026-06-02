// src/pages/ChangelogPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, ArrowLeft, Tag, Calendar, Palette, Layout, Eye, Zap, Search, ChevronDown, ChevronUp, PlayCircle, Sparkles } from 'lucide-react';
import { Sidebar } from '../components/mobile/Sidebar';
import { BottomNav } from '../components/mobile/BottomNav';
import { useNavigate } from 'react-router-dom';
import { startTour, isTourCompleted } from '../components/tour/FeatureTour';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: {
    category: string;
    icon: React.ElementType;
    items: string[];
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '4.0.1',
    date: '3 Juni 2026',
    title: 'UI/UX Overhaul - Dark Navy Theme',
    changes: [
      {
        category: 'Theme Redesign',
        icon: Palette,
        items: [
          'Dark navy background di semua halaman',
          'Glassmorphism cards dengan efek blur',
          'Warna teks konsisten (text-white dengan opacity)',
          'Hapus semua background terang (bg-white, bg-gray-50, dll)',
        ],
      },
      {
        category: 'Inspection Form',
        icon: Layout,
        items: [
          'Form lebih compact dan clean',
          'Hapus tombol "Lainnya" dari rating',
          'Hapus upload foto per-komponen',
          'Ganti "bau-bauan" menjadi "Aroma"',
          'Icon aroma menggunakan Flower2',
        ],
      },
      {
        category: 'Lucide Icons',
        icon: Eye,
        items: [
          'Semua emoji diganti Lucide React icons',
          'Rating selector menggunakan icon konsisten',
          'Status badges menggunakan icon profesional',
        ],
      },
      {
        category: 'Header & Navigasi',
        icon: Zap,
        items: [
          'Header 30% lebih tinggi di semua page',
          'Logo dan teks Proservice Indonesia 30% lebih besar',
          'QR Scanner button dengan gradient cyan-blue modern',
          'BottomNav dengan dark glass background',
        ],
      },
      {
        category: 'Search & Input',
        icon: Search,
        items: [
          'Semua search bar menggunakan dark glass style',
          'Building filter dropdown dengan icon gedung',
          'Input fields di Login/Register dengan dark theme',
          'Admin search bars (Buildings, Organizations, Locations)',
        ],
      },
    ],
  },
];

export const ChangelogPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>('4.0.1');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-6">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="bg-white/8 backdrop-blur-xl px-3 py-5 shadow-xl border-b border-white/10 lg:py-5 lg:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hidden lg:block"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Changelog</h1>
              <p className="text-xs text-white/50">Riwayat pembaruan aplikasi</p>
            </div>
          </div>
          <Tag className="w-5 h-5 text-blue-400" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {changelog.map((entry) => (
          <motion.div
            key={entry.version}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/8 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Version Header */}
            <button
              onClick={() => setExpandedVersion(expandedVersion === entry.version ? null : entry.version)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <h2 className="font-bold text-white">v{entry.version}</h2>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Calendar className="w-3 h-3" />
                    <span>{entry.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/60">{entry.title}</span>
                {expandedVersion === entry.version ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </div>
            </button>

            {/* Changes */}
            {expandedVersion === entry.version && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10"
              >
                <div className="p-4 space-y-4">
                  {entry.changes.map((change, idx) => {
                    const Icon = change.icon;
                    return (
                      <div key={idx}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-blue-400" />
                          <h3 className="font-semibold text-white text-sm">{change.category}</h3>
                        </div>
                        <ul className="space-y-1.5 pl-6">
                          {change.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
        {/* Tour CTA */}
        {!isTourCompleted() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-sky-500/10 to-cyan-500/10 border border-sky-500/30 rounded-2xl p-6 text-center"
          >
            <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-sky-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Baru di sini?</h3>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              Yuk ikuti tour singkat untuk kenalan sama fitur-fitur baru yang udah kita bikin!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startTour}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/30 transition-all inline-flex items-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Mulai Tour
            </motion.button>
          </motion.div>
        )}
      </main>

      {/* Bottom Nav */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
