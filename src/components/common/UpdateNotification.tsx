// src/components/common/UpdateNotification.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle, ArrowRight, Zap, Shield, Palette } from 'lucide-react';

const UPDATE_KEY = 'wc-checks-update-v4.0.1-dismissed';
const SHOW_DURATION_DAYS = 7;

const features = [
  {
    icon: Palette,
    title: 'Dark Navy Theme',
    description: 'Design baru dengan glassmorphism effect di semua halaman',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
  },
  {
    icon: Zap,
    title: 'Performance Boost',
    description: 'Loading lebih cepat dan UI lebih responsif',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
  },
  {
    icon: Shield,
    title: 'Improved UX',
    description: 'Navigasi lebih intuitif dan konsisten di semua device',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
  },
];

export const UpdateNotification = () => {
 const [isOpen, setIsOpen] = useState(false);

 useEffect(() => {
  const dismissedAt = localStorage.getItem(UPDATE_KEY);
  if (dismissedAt) {
   const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
   if (daysSinceDismiss < SHOW_DURATION_DAYS) return;
  }
  // Show modal after a short delay for better UX
  const timer = setTimeout(() => setIsOpen(true), 1500);
  return () => clearTimeout(timer);
 }, []);

 const handleClose = () => {
  setIsOpen(false);
  localStorage.setItem(UPDATE_KEY, Date.now().toString());
 };

 if (!isOpen) return null;

 return (
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
      {/* Header with gradient */}
      <div className="relative p-6 pb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
       <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors"
       >
        <X className="w-4 h-4 text-white/60" />
       </button>

       <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
         <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
         <p className="text-xs text-white/50 font-medium uppercase tracking-wider">What's New</p>
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
          <feature.icon className={`w-4.5 h-4.5 ${feature.color}`} />
         </div>
         <div>
          <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
          <p className="text-xs text-white/50 leading-relaxed">{feature.description}</p>
         </div>
        </motion.div>
       ))}
      </div>

      {/* CTA Button */}
      <div className="px-6 pb-6">
       <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClose}
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
 );
};
