// src/components/common/UpdateNotification.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ArrowRight, Palette, Eye, Layout, Zap, Smartphone } from 'lucide-react';

const UPDATE_KEY = 'wc-checks-update-v4.0.1-minimized';

const features = [
  {
    icon: Palette,
    title: 'Dark Navy Theme',
    description: 'Design baru dengan glassmorphism effect di semua halaman',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
  },
  {
    icon: Layout,
    title: 'Compact Inspection',
    description: 'Form inspeksi lebih ringkas dan clean tanpa tombol berlebihan',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
  },
  {
    icon: Eye,
    title: 'Lucide Icons',
    description: 'Semua emoji diganti icon profesional dari Lucide React',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
  },
  {
    icon: Smartphone,
    title: 'Login & Signup Polish',
    description: 'Glassmorphism logo frame, background decorations, dan button sky blue',
    color: 'text-sky-400',
    bg: 'bg-sky-500/20',
  },
  {
    icon: Zap,
    title: 'Header 30% Lebih Besar',
    description: 'Logo dan teks Proservice Indonesia lebih besar dan mudah dibaca',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
  },
];

export const UpdateNotification = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const minimized = localStorage.getItem(UPDATE_KEY);
    if (minimized === 'true') {
      setIsMinimized(true);
      return;
    }
    const timer = setTimeout(() => setIsOpen(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(true);
    localStorage.setItem(UPDATE_KEY, 'true');
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
              <div className="relative p-6 pb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">What's New</p>
                    <h2 className="text-xl font-bold text-white">Version 4.0.1</h2>
                  </div>
                </div>

                <p className="text-sm text-white/70 leading-relaxed">
                  Update besar dengan design baru dan peningkatan performa!
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
                    <div>
                      <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { handleClose(); navigate('/changelog'); }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Mulai Explorasi</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button (minimized) */}
      <AnimatePresence>
        {isMinimized && !isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpen}
            className="fixed bottom-24 right-20 z-[90] w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center group"
          >
            <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
            <Sparkles className="w-5 h-5 text-white relative z-10" />
            <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
              ✨ What's New — v4.0.1
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
