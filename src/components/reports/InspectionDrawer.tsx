// src/components/reports/InspectionDrawer.tsx
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { InspectionReport } from '../../hooks/useReports';
import { slideUp, backdropFade, slideInLeft, TAP_TRANSITION, STAGGER_DELAY } from '../../lib/animations';
import { useHaptic } from '../../hooks/useHaptic';

interface InspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inspections: InspectionReport[];
  selectedDate: string;
  onInspectionClick: (inspection: InspectionReport) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return 'bg-green-100 text-green-700 border-green-200';
  if (score >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const getScoreEmoji = (score: number) => {
  if (score >= 85) return '😊';
  if (score >= 70) return '😐';
  return '😟';
};

export const InspectionDrawer = ({
  isOpen,
  onClose,
  inspections,
  selectedDate,
  onInspectionClick,
}: InspectionDrawerProps) => {
  const haptic = useHaptic();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastScrollTop = useRef(0);
  const hasReachedBottom = useRef(false);

  // Handle swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const y = e.touches[0].clientY;
    const delta = y - startY;
    if (delta > 0) { // Only allow downward swipe
      setCurrentY(delta);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentY > 100) { // Close threshold
      onClose();
    }
    setCurrentY(0);
  };

  // Handle scroll boundary haptic feedback
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Check if scrolled to bottom (with 5px threshold for smooth detection)
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

    // Detect scroll direction
    const isScrollingDown = scrollTop > lastScrollTop.current;

    // Trigger haptic only once when reaching bottom while scrolling down
    if (isAtBottom && isScrollingDown && !hasReachedBottom.current) {
      haptic.light();
      hasReachedBottom.current = true;
    }

    // Reset flag when scrolling back up
    if (!isAtBottom && hasReachedBottom.current) {
      hasReachedBottom.current = false;
    }

    lastScrollTop.current = scrollTop;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset scroll state when drawer opens
      hasReachedBottom.current = false;
      lastScrollTop.current = 0;
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Validate selectedDate before formatting
  const formattedDate = selectedDate
    ? format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')
    : '';

  return (
    <AnimatePresence>
      {isOpen && selectedDate && (
        <>
          {/* Backdrop with smooth fade */}
          <motion.div
            {...backdropFade}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Drawer with smooth slide-up animation */}
          <motion.div
            {...slideUp}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] flex flex-col"
            style={{
              willChange: isDragging ? 'transform' : 'auto',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
        {/* Drag Handle */}
        <div
          className="py-3 flex justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Inspeksi
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {formattedDate}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {inspections.length} inspeksi
                </span>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              transition={TAP_TRANSITION}
            >
              <X className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* Inspection List */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 pt-4 pb-24 space-y-3 overscroll-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            willChange: 'scroll-position',
          }}
        >
          {inspections.map((inspection, idx) => {
            const score = (inspection.responses as any)?.score || 0;
            const scoreColor = getScoreColor(score);
            const emoji = getScoreEmoji(score);

            return (
              <motion.button
                key={inspection.id}
                onClick={() => {
                  haptic.medium();
                  onInspectionClick(inspection);
                }}
                className="w-full bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200 text-left"
                {...slideInLeft}
                transition={{
                  ...slideInLeft.transition,
                  delay: idx * STAGGER_DELAY,
                }}
                whileHover={{ scale: 1.015, x: 2 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start justify-between space-x-3">
                  {/* Left side - Location info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 truncate">
                        {inspection.location.name}
                      </h3>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      {/* Organization */}
                      {inspection.location.organization?.name && (
                        <p className="truncate">
                          🏢 {inspection.location.organization.name}
                        </p>
                      )}
                      {/* Building and Floor */}
                      {inspection.location.building && (
                        <p className="truncate">
                          📍 {inspection.location.building_ref?.name || inspection.location.building} • {inspection.location.floor}
                        </p>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{inspection.inspection_time}</span>
                      </div>
                    </div>

                    {/* Photos indicator */}
                    {inspection.photo_urls.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          📸 {inspection.photo_urls.length} foto
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right side - Score */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className={`
                      px-3 py-2 rounded-xl border-2 font-bold
                      flex items-center space-x-1.5
                      ${scoreColor}
                    `}>
                      <span className="text-lg">{emoji}</span>
                      <span className="text-xl">{score}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">Skor</span>
                  </div>
                </div>

                {/* Notes preview */}
                {inspection.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      💬 {inspection.notes}
                    </p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};