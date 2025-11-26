// src/components/reports/InspectionDetailModal.tsx - MODERN REDESIGN
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, User, Camera, FileText, AlertCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import { InspectionReport } from '../../hooks/useReports';
import { INSPECTION_COMPONENTS, calculateWeightedScore, getScoreStatus, ComponentRating } from '../../types/inspection.types';
import { PhotoReviewModal } from './PhotoReviewModal';
import { scaleIn, backdropFade, slideInLeft, HOVER_TRANSITION, TAP_TRANSITION, STAGGER_DELAY } from '../../lib/animations';
import { useHaptic } from '../../hooks/useHaptic';

// Helper to get score-based gradient (like SuccessModal)
const getScoreGradient = (score: number) => {
  if (score >= 90) return 'from-green-500 via-emerald-500 to-teal-600';
  if (score >= 75) return 'from-blue-500 via-indigo-500 to-purple-600';
  if (score >= 60) return 'from-yellow-500 via-amber-500 to-orange-600';
  return 'from-red-500 via-rose-500 to-pink-600';
};

const getScoreTextColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

interface InspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionReport | null;
}

// Helper to extract score from responses
const getScoreFromResponses = (responses: any): number => {
  if (!responses) return 0;
  
  // Direct score field
  if (typeof responses.score === 'number') return responses.score;
  
  // Calculate from ratings array (NEW format)
  if (Array.isArray(responses.ratings) && responses.ratings.length > 0) {
    return calculateWeightedScore(responses.ratings);
  }
  
  // Fallback for old format
  const values = Object.values(responses).filter(v => 
    typeof v === 'string' || typeof v === 'boolean'
  );
  if (values.length === 0) return 0;
  
  const goodCount = values.filter(v => 
    v === true || v === 'good' || v === 'excellent' || v === 'baik'
  ).length;
  
  return Math.round((goodCount / values.length) * 100);
};

const getChoiceEmoji = (choice: string, category: string): string => {
  if (category === 'aroma') {
    switch (choice) {
      case 'good': return '🌸';
      case 'normal': return '😐';
      case 'bad': return '🤢';
      case 'other': return '💬';
      default: return '❓';
    }
  }

  if (category === 'visual') {
    switch (choice) {
      case 'good': return '✨';
      case 'normal': return '😐';
      case 'bad': return '💩';
      case 'other': return '💬';
      default: return '❓';
    }
  }

  if (category === 'availability' || category === 'functional') {
    switch (choice) {
      case 'good': return '✅';
      case 'normal': return '⚠️';
      case 'bad': return '❌';
      case 'other': return '💬';
      default: return '❓';
    }
  }

  return '❓';
};

const getChoiceColor = (choice: string): string => {
  switch (choice) {
    case 'good':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'normal':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'bad':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'other':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getChoiceLabel = (choice: string): string => {
  switch (choice) {
    case 'good':
      return 'Baik';
    case 'normal':
      return 'Normal';
    case 'bad':
      return 'Buruk';
    case 'other':
      return 'Lainnya';
    default:
      return choice;
  }
};

export const InspectionDetailModal = ({
  isOpen,
  onClose,
  inspection,
}: InspectionDetailModalProps) => {
  const haptic = useHaptic();
  const [photoReviewOpen, setPhotoReviewOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!isOpen || !inspection) return null;

  const responses = inspection.responses as any;
  const score = getScoreFromResponses(responses);
  const scoreStatus = getScoreStatus(score);
  const ratings: ComponentRating[] = responses?.ratings || [];
  const issues = responses?.issues;
  const maintenance = responses?.maintenance;
  const inspectionMode = responses?.inspection_mode || 'professional';

  const formattedDate = format(new Date(inspection.inspection_date), 'EEEE, MMMM d, yyyy');

  const handlePhotoClick = (index: number) => {
    haptic.light();
    setSelectedPhotoIndex(index);
    setPhotoReviewOpen(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with smooth fade animation */}
          <motion.div
            {...backdropFade}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal with smooth scale animation */}
          <motion.div
            {...scaleIn}
            className="fixed left-4 right-4 top-4 bottom-16 max-w-2xl mx-auto my-auto z-[60] max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
          {/* Header - Dynamic gradient based on score */}
          <div className={`bg-gradient-to-br ${getScoreGradient(score)} p-6 text-white relative overflow-hidden rounded-t-3xl flex-shrink-0`}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl animate-pulse delay-700" />
            </div>

            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors duration-200 z-20"
              type="button"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              transition={TAP_TRANSITION}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Location info with better spacing */}
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl border border-white/30">
                  🚽
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{inspection.location?.name}</h2>
                  <div className="flex items-center space-x-2 text-white/90 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{inspection.location?.building}</span>
                    <span>•</span>
                    <span>{inspection.location?.floor}</span>
                  </div>
                </div>
              </div>

              {/* Score display - BIG and beautiful */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/50">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-extrabold ${getScoreTextColor(score)}`}>
                        {score}
                      </span>
                      <span className="text-lg text-gray-500 font-medium">/ 100</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/25 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 flex items-center gap-2">
                  <span className="text-2xl">{scoreStatus.emoji}</span>
                  <span className="text-sm font-semibold">{scoreStatus.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content - Scrollable area */}
          <div className="overflow-y-auto flex-1 px-6 pt-6 pb-6 space-y-6 rounded-b-3xl">
            {/* Metadata - Modern cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date & Time Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-600 mb-1">Tanggal & Waktu</p>
                    <p className="font-semibold text-gray-900 text-sm truncate">{formattedDate}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{inspection.inspection_time}</p>
                  </div>
                </div>
              </div>

              {/* Inspector Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-purple-600 mb-1">Inspektur</p>
                    <p className="font-semibold text-gray-900 text-sm truncate">{inspection.user?.full_name}</p>
                    <p className="text-xs text-gray-600 truncate mt-0.5">{inspection.user?.email}</p>
                    {inspection.occupation && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {inspection.occupation.icon && (
                          <span className="text-sm">{inspection.occupation.icon}</span>
                        )}
                        <span
                          className="text-xs font-semibold"
                          style={{ color: inspection.occupation.color || '#6b7280' }}
                        >
                          {inspection.occupation.display_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Component Ratings */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                <span>📋</span>
                <span>Penilaian Komponen</span>
              </h3>
              <div className="space-y-3">
                {ratings.map((rating: ComponentRating, index: number) => {
                  const component = INSPECTION_COMPONENTS.find(c => c.id === rating.component);
                  if (!component) return null;

                  // Handle unavailable components
                  if (rating.isAvailable === false) {
                    return (
                      <motion.div
                        key={index}
                        className="rounded-xl p-4 border-2 bg-gray-50 border-gray-300"
                        {...slideInLeft}
                        transition={{
                          ...slideInLeft.transition,
                          delay: index * STAGGER_DELAY,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xl">
                                {inspectionMode === 'genz' ? component.iconGenZ : component.icon}
                              </span>
                              <span className="font-medium text-gray-900">
                                {component.labelGenZ || component.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                            <span className="text-xl">⏭️</span>
                            <span className="text-sm font-medium text-gray-600">
                              Tidak Ada
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={index}
                      className={`rounded-xl p-4 border-2 ${getChoiceColor(rating.choice)}`}
                      {...slideInLeft}
                      transition={{
                        ...slideInLeft.transition,
                        delay: index * STAGGER_DELAY,
                      }}
                      whileHover={{ scale: 1.015, x: 2 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xl">
                              {inspectionMode === 'genz' ? component.iconGenZ : component.icon}
                            </span>
                            <span className="font-medium text-gray-900">
                              {component.labelGenZ || component.label}
                            </span>
                          </div>
                          {rating.notes && (
                            <p className="text-sm text-gray-600 mt-2 pl-7">
                              💬 {rating.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                          <span className="text-2xl">
                            {getChoiceEmoji(rating.choice, component.category)}
                          </span>
                          <span className="text-sm font-medium">
                            {getChoiceLabel(rating.choice)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Issues Section */}
            {issues && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900 mb-1">Masalah Ditemukan</h4>
                    <p className="text-sm text-orange-800">{issues.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Required */}
            {maintenance && maintenance.required && (
              <div className={`
                border-2 rounded-xl p-4
                ${maintenance.priority === 'urgent' 
                  ? 'bg-red-50 border-red-200' 
                  : maintenance.priority === 'high'
                    ? 'bg-orange-50 border-orange-200'
                    : maintenance.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                }
              `}>
                <div className="flex items-start space-x-2">
                  <span className="text-xl">🔧</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Perlu Perbaikan
                    </h4>
                    <p className="text-sm text-gray-700">
                      Prioritas: <span className="font-semibold capitalize">{maintenance.priority}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {inspection.photo_urls && inspection.photo_urls.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Foto Dokumentasi ({inspection.photo_urls.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 place-items-center">
                  {inspection.photo_urls.map((url, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handlePhotoClick(idx)}
                      className="w-full aspect-square rounded-xl overflow-hidden shadow-md cursor-pointer group relative"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: idx * STAGGER_DELAY * 2,
                        duration: 0.4,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <img
                        src={url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors duration-200">
                        <Camera className="w-8 h-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* General Notes */}
            {inspection.notes && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Catatan Umum</h4>
                    <p className="text-sm text-gray-700">{inspection.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom spacer - prevents content from sticking to BottomNav */}
            <div className="h-16" />
          </div>
        </div>
      </motion.div>

      {/* Photo Review Modal */}
      <PhotoReviewModal
        isOpen={photoReviewOpen}
        onClose={() => setPhotoReviewOpen(false)}
        photos={inspection.photo_urls || []}
        initialIndex={selectedPhotoIndex}
      />
        </>
      )}
    </AnimatePresence>
  );
};