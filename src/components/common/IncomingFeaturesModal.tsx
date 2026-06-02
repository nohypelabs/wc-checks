// src/components/common/IncomingFeaturesModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Wifi, Users, Cpu, Zap, Lock } from 'lucide-react';

const STORAGE_KEY = 'wc-checks-incoming-features-minimized';

const features = [
  {
    icon: Wifi,
    title: 'Integrasi Sensor Aroma',
    description: 'Deteksi kualitas udara toilet secara real-time. Sistem otomatis memicu notifikasi inspeksi ketika level bau melewati ambang batas — tanpa perlu laporan manual.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
  },
  {
    icon: Users,
    title: 'Smart Visitor Counter',
    description: 'Pantau lalu lintas pengunjung dan jadwalkan pembersihan otomatis berdasarkan jumlah kunjungan. Makin ramai, makin cepat sistem merespons.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
  },
];

export const IncomingFeaturesModal = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const minimized = localStorage.getItem(STORAGE_KEY);
    if (minimized === 'true') {
      setIsMinimized(true);
      return;
    }
    // Show modal after delay
    const timer = setTimeout(() => setIsOpen(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* Main Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
            >
              {/* Header */}
              <div className="relative p-6 pb-4 bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-purple-500/20">
                {/* Animated bg pulse */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 animate-pulse" />

                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors z-10"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>

                <div className="relative flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <Cpu className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">New Update Incoming</p>
                    <h2 className="text-lg font-bold text-white">🔧 IoT Integration</h2>
                  </div>
                </div>

                <p className="relative text-sm text-white/70 leading-relaxed">
                  Kami sedang mengembangkan fitur terbaru yang akan membawa sistem inspeksi ke level berikutnya.
                </p>
              </div>

              {/* Features list */}
              <div className="p-6 space-y-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-9 h-9 ${feature.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Closing & CTA */}
              <div className="px-6 pb-6">
                <p className="text-sm text-white/60 leading-relaxed mb-4 text-center">
                  Dengan update ini, platform kami berevolusi dari aplikasi inspeksi manual menjadi sistem manajemen fasilitas berbasis IoT — lebih cerdas, lebih otomatis, lebih akurat.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { handleClose(); navigate('/upgrade'); }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Upgrade ke Paket Max</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <p className="text-center text-[11px] text-white/40 mt-2">
                  Fitur eksklusif untuk pengguna Paket Max 🔒
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button (minimized state) */}
      <AnimatePresence>
        {isMinimized && !isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpen}
            className="fixed bottom-24 right-4 z-[90] w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center group"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Cpu className="w-6 h-6 text-white relative z-10" />
            </motion.div>
            {/* Tooltip */}
            <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
              🔥 Fitur IoT Coming Soon
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
