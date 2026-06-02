// src/components/tour/FeatureTour.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, SkipForward, X, MapPin, Calendar, FileText, CheckCircle } from 'lucide-react';

const TOUR_KEY = 'wc-checks-feature-tour-completed';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: React.ComponentType<{ className?: string }>;
  highlightPadding?: number;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Selamat Datang! 👋',
    description: 'Yuk kita jalan-jalan kenalan sama fitur-fitur baru yang udah kita bikin. Klik Next untuk mulai tour!',
    position: 'center',
    icon: MapPin,
  },
  {
    id: 'riwayat',
    title: 'Halaman Riwayat',
    description: 'Ini adalah halaman riwayat inspection. Semua data inspection tersimpan di sini dengan detail lengkap.',
    route: '/history',
    targetSelector: '[data-tour="reports-page"]',
    position: 'bottom',
    icon: Calendar,
  },
  {
    id: 'inspection-list',
    title: 'Daftar Inspection',
    description: 'Setiap card menunjukkan inspection yang sudah dilakukan. Klik salah satu untuk melihat detail lengkapnya.',
    route: '/history',
    targetSelector: '[data-tour="inspection-card"]',
    position: 'right',
    icon: FileText,
  },
  {
    id: 'detail-modal',
    title: 'Detail Inspection',
    description: 'Di sini kamu bisa lihat score, foto, catatan, dan semua komponen yang di-inspect. Export ke PDF juga bisa!',
    targetSelector: '[data-tour="inspection-detail"]',
    position: 'left',
    icon: FileText,
  },
  {
    id: 'complete',
    title: 'Tour Selesai! 🎉',
    description: 'Sekarang kamu udah kenal sama fitur-fitur utama. Silakan explore sendiri dan mulai inspeksi!',
    position: 'center',
    icon: CheckCircle,
  },
];

interface FeatureTourProps {
  onComplete?: () => void;
}

export const FeatureTour = ({ onComplete }: FeatureTourProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if tour should auto-start
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('tour') === 'start' && !completed) {
      setIsActive(true);
      setCurrentStep(0);
    }
  }, [location.search]);

  // Navigate to route when step changes
  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    if (step.route && location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [isActive, currentStep, location.pathname, navigate]);

  // Find and measure target element
  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const el = document.querySelector(step.targetSelector!);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    // Wait for navigation/render
    const timer = setTimeout(findTarget, 500);
    return () => clearTimeout(timer);
  }, [isActive, currentStep]);

  // Update rect on scroll/resize
  useEffect(() => {
    if (!isActive || !targetRect) return;
    const step = TOUR_STEPS[currentStep];
    if (!step.targetSelector) return;

    const update = () => {
      const el = document.querySelector(step.targetSelector!);
      if (el) setTargetRect(el.getBoundingClientRect());
    };

    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isActive, currentStep, targetRect]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(TOUR_KEY, 'true');
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || step.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      };
    }

    const padding = 16;
    switch (step.position) {
      case 'bottom':
        return {
          position: 'fixed',
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
          zIndex: 10001,
        };
      case 'top':
        return {
          position: 'fixed',
          bottom: window.innerHeight - targetRect.top + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
          zIndex: 10001,
        };
      case 'right':
        return {
          position: 'fixed',
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + padding,
          transform: 'translateY(-50%)',
          zIndex: 10001,
        };
      case 'left':
        return {
          position: 'fixed',
          top: targetRect.top + targetRect.height / 2,
          right: window.innerWidth - targetRect.left + padding,
          transform: 'translateY(-50%)',
          zIndex: 10001,
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
        };
    }
  };

  return (
    <>
      {/* Overlay with spotlight cutout */}
      <div
        className="fixed inset-0 z-[10000]"
        style={{
          background: targetRect
            ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 8}px, rgba(0,0,0,0.7) ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px)`
            : 'rgba(0,0,0,0.7)',
          transition: 'all 0.3s ease',
        }}
        onClick={handleSkip}
      />

      {/* Highlight border */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed z-[10000] pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            border: '2px solid rgba(14, 165, 233, 0.8)',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)',
          }}
        />
      )}

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={getTooltipStyle()}
          className="w-[320px]"
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Header */}
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-sky-400" />
                  </div>
                  <span className="text-xs text-white/40 font-medium">
                    {currentStep + 1}/{TOUR_STEPS.length}
                  </span>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
              >
                <SkipForward className="w-3 h-3" />
                Skip Tour
              </button>

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={handlePrev}
                    className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-500/30 transition-all flex items-center gap-1"
                >
                  {isLast ? 'Mulai!' : 'Next'}
                  {!isLast && <ArrowRight className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

// Helper to start tour from anywhere
export const startTour = () => {
  localStorage.removeItem(TOUR_KEY);
  window.location.href = '/history?tour=start';
};

// Check if tour is completed
export const isTourCompleted = () => {
  return localStorage.getItem(TOUR_KEY) === 'true';
};
