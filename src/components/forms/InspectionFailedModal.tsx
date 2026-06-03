// src/components/forms/InspectionFailedModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, RefreshCw, ArrowLeft, AlertTriangle, WifiOff } from 'lucide-react';

interface InspectionFailedModalProps {
 isOpen: boolean;
 onClose: () => void;
 onRetry: () => void;
 errorMessage: string;
}

export const InspectionFailedModal = ({
 isOpen,
 onClose,
 onRetry,
 errorMessage,
}: InspectionFailedModalProps) => {
 if (!isOpen) return null;

 // Detect error type
 const isNetworkError =
 errorMessage.toLowerCase().includes('network') ||
 errorMessage.toLowerCase().includes('fetch') ||
 errorMessage.toLowerCase().includes('connection') ||
 errorMessage.toLowerCase().includes('timeout');

 const isUploadError =
 errorMessage.toLowerCase().includes('upload') ||
 errorMessage.toLowerCase().includes('cloudinary');

 const getErrorIcon = () => {
 if (isNetworkError) return WifiOff;
 if (isUploadError) return AlertTriangle;
 return XCircle;
 };

 const ErrorIcon = getErrorIcon();

 const getErrorTitle = () => {
 if (isNetworkError) return 'Koneksi Terputus';
 if (isUploadError) return 'Upload Gagal';
 return 'Submit Gagal';
 };

 const getErrorDescription = () => {
 if (isNetworkError) {
 return 'Gak bisa konek ke server. Cek koneksi internet lo dan coba lagi.';
 }
 if (isUploadError) {
 return 'Gagal upload foto. Cek koneksi internet lo dan coba lagi.';
 }
 return 'Ada yang salah pas nyimpen inspeksi lo. Data lo aman kok, tinggal coba lagi aja.';
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <>
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
 className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
 />

 {/* Modal */}
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
 className="bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
 {/* Error Header */}
 <div className="bg-gradient-to-br from-red-500 to-rose-600 p-8 text-center relative overflow-hidden">
 {/* Decorative elements */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
 <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

 {/* Content */}
 <div className="relative z-10">
 <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-sm rounded-full mb-4 shadow-xl border border-white/20">
 <ErrorIcon className="w-12 h-12 text-red-300" />
 </div>

 <h2 className="text-2xl font-bold text-white mb-2">
 {getErrorTitle()}
 </h2>

 <p className="text-white/90 text-sm">
 Tenang, data inspeksi lo aman kok
 </p>
 </div>
 </div>

 {/* Error Details */}
 <div className="p-6 space-y-4">
 {/* Main Error Message */}
 <div className="bg-red-500/15 border border-red-400/25 rounded-xl p-4">
 <p className="text-sm text-red-200 leading-relaxed">
 {getErrorDescription()}
 </p>
 </div>

 {/* Technical Error (collapsible) */}
 {errorMessage && (
 <details className="text-xs">
 <summary className="text-white/60 cursor-pointer hover:text-white font-medium">
 Detail teknis
 </summary>
 <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
 <p className="text-white/70 break-words font-mono">
 {errorMessage}
 </p>
 </div>
 </details>
 )}

 {/* Tips */}
 <div className="bg-blue-500/15 border border-blue-400/25 rounded-xl p-4">
 <p className="text-sm font-semibold text-blue-200 mb-2">
 Apa yang harus dilakukan:
 </p>
 <ul className="text-sm text-blue-200/80 space-y-1.5">
 {isNetworkError && (
 <>
 <li>• Cek koneksi internet lo</li>
 <li>• Pastiin WiFi atau data lo stabil</li>
 <li>• Coba pindah ke tempat dengan sinyal lebih bagus</li>
 </>
 )}
 {isUploadError && (
 <>
 <li>• Cek kecepatan internet lo</li>
 <li>• Pastiin foto gak terlalu gede</li>
 <li>• Coba dengan foto lebih sedikit</li>
 </>
 )}
 <li>• Data inspeksi lo udah kesimpen lokal</li>
 <li>• Klik "Coba Lagi" kalo udah siap</li>
 </ul>
 </div>

 {/* Action Buttons */}
 <div className="space-y-3 pt-2">
 {/* Retry Button */}
 <button
 onClick={onRetry}
 className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
 >
 <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
 <span>Coba Lagi</span>
 </button>

 {/* Back Button */}
 <button
 onClick={onClose}
 className="w-full bg-slate-800/80 hover:bg-slate-700/80 text-white py-4 rounded-xl font-semibold border-2 border-white/15 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
 >
 <ArrowLeft className="w-5 h-5" />
 <span>Kembali</span>
 </button>
 </div>

 {/* 🔥 REMOVED: Network Status Indicator - no offline detection */}
 </div>
 </div>
 </div>

 {/* Animations */}
 <style>{`
 @keyframes fadeIn {
 from {
 opacity: 0;
 }
 to {
 opacity: 1;
 }
 }

 @keyframes shakeIn {
 0% {
 opacity: 0;
 transform: scale(0.9) translateY(-20px);
 }
 50% {
 transform: scale(1.02) translateY(0);
 }
 100% {
 opacity: 1;
 transform: scale(1) translateY(0);
 }
 }

 .animate-fadeIn {
 animation: fadeIn 0.2s ease-out;
 }

 .animate-shakeIn {
 animation: shakeIn 0.4s ease-out;
 }
 `}</style>
 </>
 )}
 </AnimatePresence>
 );
};
