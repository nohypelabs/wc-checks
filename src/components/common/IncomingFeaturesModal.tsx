// src/components/common/IncomingFeaturesModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, Wifi, Users, TrendingUp, Bell, Cpu, Zap } from 'lucide-react';

const STORAGE_KEY = 'wc-checks-incoming-features-minimized';

const features = [
  {
    icon: Wifi,
    title: 'Alat Pendeteksi Bau',
    description: 'Sensor IoT yang mendeteksi bau toilet secara real-time dan otomatis trigger alert ke petugas kebersihan',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    status: 'Dalam Pengembangan',
    statusColor: 'bg-green-500/20 text-green-400',
  },
  {
    icon: Users,
    title: 'Counter Pengunjung',
    description: 'Alat hitung pengunjung otomatis dengan sensor infrared — data langsung masuk ke dashboard analytics',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    status: 'Dalam Pengembangan',
    statusColor: 'bg-cyan-500/20 text-cyan-400',
  },
  {
    icon: TrendingUp,
    title: 'Dashboard Real-Time',
    description: 'Monitor tingkat bau dan jumlah pengunjung secara live dari dashboard — notifikasi otomatis jika melebihi threshold',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    status: 'Coming Soon',
    statusColor: 'bg-purple-500/20 text-purple-400',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Sistem notifikasi pintar — WhatsApp & push notification ketika kondisi toilet perlu perhatian segera',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    status: 'Coming Soon',
    statusColor: 'bg-yellow-500/20 text-yellow-400',
  },
];

export const IncomingFeaturesModal = () => {
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
                    <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Incoming Update</p>
                    <h2 className="text-xl font-bold text-white">IoT Integration</h2>
                  </div>
                </div>

                <p className="relative text-sm text-white/70 leading-relaxed">
                  Sistem monitoring toilet akan terintegrasi dengan perangkat hardware! 🚀
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
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${feature.statusColor}`}>
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Upgrade CTA */}
              <div className="px-6 pb-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Fitur ini untuk Paket Max</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <p className="text-center text-[11px] text-white/40 mt-2">
                  Upgrade untuk akses fitur IoT pertama di Indonesia
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
