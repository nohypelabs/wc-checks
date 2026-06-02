// src/components/common/PWAInstallPrompt.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../hooks/useAuth';

export const PWAInstallPrompt = () => {
 const { isInstallable, hasShownPrompt, install, dismiss } = usePWAInstall();
 const { user } = useAuth();
 const [isVisible, setIsVisible] = useState(false);
 const [isInstalling, setIsInstalling] = useState(false);

 useEffect(() => {
 // Show prompt after login if:
 // 1. PWA is installable
 // 2. Prompt hasn't been shown before
 // 3. User is logged in
 if (isInstallable && !hasShownPrompt && user) {
 // Delay showing prompt for better UX (user sees app first)
 const timer = setTimeout(() => {
 setIsVisible(true);
 }, 2000); // Show after 2 seconds

 return () => clearTimeout(timer);
 }
 }, [isInstallable, hasShownPrompt, user]);

 const handleInstall = async () => {
 setIsInstalling(true);
 const accepted = await install();
 setIsInstalling(false);

 if (accepted) {
 // Installation accepted, prompt will auto-hide
 setIsVisible(false);
 }
 };

 const handleDismiss = () => {
 setIsVisible(false);
 dismiss();
 };

 if (!isVisible) return null;

 return (
 <AnimatePresence>
 <motion.div
 initial={{ x: 400, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: 400, opacity: 0 }}
 transition={{
 type: 'spring',
 stiffness: 200,
 damping: 25,
 duration: 0.4,
 }}
 className="fixed top-4 right-4 z-[60] w-full max-w-sm"
 >
 <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/15 p-5 mx-4">
 {/* Header with close button */}
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
 <Smartphone className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="font-bold text-white text-base">
 Install Aplikasi
 </h3>
 <p className="text-xs text-white/60">Proservice Indonesia</p>
 </div>
 </div>
 <motion.button
 onClick={handleDismiss}
 className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
 whileHover={{ scale: 1.05, rotate: 90 }}
 whileTap={{ scale: 0.95 }}
 >
 <X className="w-4 h-4 text-white/60" />
 </motion.button>
 </div>

 {/* Content */}
 <p className="text-sm text-white/70 mb-4 leading-relaxed">
 Install aplikasi ini ke home screen untuk akses lebih cepat dan pengalaman yang lebih baik!
 </p>

 {/* Features/Benefits */}
 <div className="space-y-2 mb-4">
 <div className="flex items-center gap-2 text-xs text-white/70">
 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
 <span>Akses instant dari home screen</span>
 </div>
 <div className="flex items-center gap-2 text-xs text-white/70">
 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
 <span>Bekerja seperti aplikasi native</span>
 </div>
 <div className="flex items-center gap-2 text-xs text-white/70">
 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
 <span>Tidak perlu membuka browser</span>
 </div>
 </div>

 {/* Action buttons */}
 <div className="flex gap-2">
 <motion.button
 onClick={handleInstall}
 disabled={isInstalling}
 className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 whileHover={{ scale: 1.02, y: -1 }}
 whileTap={{ scale: 0.98 }}
 style={{
 boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
 }}
 >
 {isInstalling ? (
 <>
 <motion.div
 animate={{ rotate: 360 }}
 transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
 >
 <Download className="w-4 h-4" />
 </motion.div>
 <span className="text-sm">Installing...</span>
 </>
 ) : (
 <>
 <Download className="w-4 h-4" />
 <span className="text-sm">Install Sekarang</span>
 </>
 )}
 </motion.button>

 <motion.button
 onClick={handleDismiss}
 className="px-4 py-2.5 text-white/70 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium"
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 >
 Nanti
 </motion.button>
 </div>

 {/* Helper text */}
 <p className="text-[10px] text-gray-400 text-center mt-3">
 Prompt ini hanya muncul sekali
 </p>
 </div>
 </motion.div>
 </AnimatePresence>
 );
};
