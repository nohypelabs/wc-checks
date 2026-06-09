// src/components/reports/InspectionDetailModal.tsx - MODERN REDESIGN
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, User, Camera, FileText, AlertCircle, Building2, ClipboardList, Wrench, SkipForward, MessageSquare, Toilet, CheckCircle2, XCircle, AlertTriangle, HelpCircle, Briefcase } from 'lucide-react';
import * as Icons from 'lucide-react';
import { format } from 'date-fns';
import { InspectionReport } from '../../hooks/useReports';
import { INSPECTION_COMPONENTS, calculateWeightedScore, getScoreStatus, ComponentRating } from '../../types/inspection.types';
import { PhotoReviewModal } from './PhotoReviewModal';
import { slideInLeft, TAP_TRANSITION, STAGGER_DELAY } from '../../lib/animations';
import { useHaptic } from '../../hooks/useHaptic';

const getScoreTextColor = (score: number) => {
 if (score >= 90) return 'text-green-300';
 if (score >= 75) return 'text-white/80';
 if (score >= 60) return 'text-yellow-600';
 return 'text-red-300';
};

const getScoreGlassBg = (score: number) => {
 if (score >= 90) return 'bg-green-500/20 backdrop-blur-xl border-b border-green-400/20';
 if (score >= 75) return 'bg-blue-500/20 backdrop-blur-xl border-b border-blue-400/20';
 if (score >= 60) return 'bg-yellow-500/20 backdrop-blur-xl border-b border-yellow-400/20';
 return 'bg-red-500/20 backdrop-blur-xl border-b border-red-400/20';
};

const getScoreGlassBadge = (score: number) => {
 if (score >= 90) return 'bg-green-500/25 backdrop-blur-xl border border-green-400/30';
 if (score >= 75) return 'bg-blue-500/25 backdrop-blur-xl border border-blue-400/30';
 if (score >= 60) return 'bg-yellow-500/25 backdrop-blur-xl border border-yellow-400/30';
 return 'bg-red-500/25 backdrop-blur-xl border border-red-400/30';
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

const getChoiceIcon = (choice: string) => {
 switch (choice) {
 case 'good': return CheckCircle2;
 case 'normal': return AlertTriangle;
 case 'bad': return XCircle;
 case 'other': return MessageSquare;
 default: return HelpCircle;
 }
};

const getChoiceIconColor = (choice: string): string => {
 switch (choice) {
 case 'good': return 'text-green-400';
 case 'normal': return 'text-yellow-400';
 case 'bad': return 'text-red-400';
 case 'other': return 'text-blue-400';
 default: return 'text-white/50';
 }
};

const getChoiceColor = (choice: string): string => {
 switch (choice) {
 case 'good':
 return 'bg-green-500/15 text-green-200 border-green-400/25';
 case 'normal':
 return 'bg-yellow-500/15 text-yellow-200 border-yellow-400/25';
 case 'bad':
 return 'bg-red-500/15 text-red-200 border-red-400/25';
 case 'other':
 return 'bg-blue-500/15 text-blue-200 border-blue-400/25';
 default:
 return 'bg-white/10 text-white/70 border-white/15';
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
 {/* Backdrop with spring fade */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
 className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
 onClick={onClose}
 />

 {/* Modal with spring scale */}
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
 className="fixed left-3 right-3 top-3 bottom-3 max-w-2xl mx-auto my-auto z-[60] max-h-[94vh]"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="bg-white/8 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col border border-white/10" data-tour="inspection-detail">
 {/* Header - Score-based glassmorphism */}
 <div className={`p-4 text-white relative rounded-t-3xl flex-shrink-0 overflow-hidden ${getScoreGlassBg(score)}`}>
 {/* Decorative glass circles */}
 <div className="absolute inset-0 opacity-10 pointer-events-none">
 <div className="absolute -top-8 -right-8 w-32 h-32 bg-white rounded-full blur-2xl" />
 <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white rounded-full blur-xl" />
 </div>

 {/* Location info with better spacing */}
 <div className="relative z-10">
 <div className="flex items-center space-x-2 mb-3">
 <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 flex-shrink-0">
 <Toilet className="w-5 h-5 text-white/80" />
 </div>
 <div className="flex-1 min-w-0">
 <h2 className="text-lg font-bold leading-tight truncate">{inspection.location?.name}</h2>
 <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
 {inspection.location?.organization?.name && (
 <div className="flex items-center space-x-1 text-white/90 text-xs">
 <Building2 className="w-3 h-3" />
 <span className="truncate">{inspection.location.organization.name}</span>
 </div>
 )}
 <div className="flex items-center space-x-1 text-white/90 text-xs">
 <MapPin className="w-3 h-3" />
 <span className="truncate">{inspection.location?.building_ref?.name || inspection.location?.building}</span>
 <span>•</span>
 <span>{inspection.location?.floor}</span>
 </div>
 </div>
 </div>
 {/* Score badge inline with header */}
 <div className="flex flex-col items-center flex-shrink-0 ml-1">
 <div className={`${getScoreGlassBadge(score)} px-3 py-1.5 rounded-xl`}>
 <div className="flex items-baseline gap-1">
 <span className={`text-2xl font-extrabold ${getScoreTextColor(score)}`}>
 {score}
 </span>
 <span className="text-xs text-white/50 font-medium">/100</span>
 </div>
 </div>
 <div className="flex items-center gap-1 mt-1">
 {(() => {
  const IconComponent = scoreStatus.icon ? (Icons as any)[scoreStatus.icon] : null;
  return IconComponent ? (
   <IconComponent className="w-4 h-4" />
  ) : null;
 })()}
 <span className="text-xs font-semibold">{scoreStatus.label}</span>
 </div>
 </div>
 </div>

 </div>
 </div>

 {/* Close button — top-right of modal, above header */}
 <motion.button
 onClick={onClose}
 className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors duration-200 z-30 border border-white/10"
 type="button"
 whileHover={{ scale: 1.05, rotate: 90 }}
 whileTap={{ scale: 0.95 }}
 transition={TAP_TRANSITION}
 >
 <X className="w-4 h-4" />
 </motion.button>

 {/* Content - Scrollable area */}
 <div className="overflow-y-auto flex-1 px-4 pt-3 pb-3 space-y-3 rounded-b-3xl">
 {/* Metadata - Compact inline cards */}
 <div className="grid grid-cols-2 gap-2">
 {/* Date & Time Card */}
 <div className="bg-white/10 rounded-xl p-2.5 border border-white/15">
 <div className="flex items-center space-x-2">
 <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
 <Clock className="w-4 h-4 text-white/80" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-medium text-white/80">Tanggal & Waktu</p>
 <p className="font-semibold text-white text-xs truncate">{formattedDate}</p>
 <p className="text-xs text-white/70">{inspection.inspection_time}</p>
 </div>
 </div>
 </div>

 {/* Inspector Card */}
 <div className="bg-white/10 rounded-xl p-2.5 border border-white/15">
 <div className="flex items-center space-x-2">
 <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
 <User className="w-4 h-4 text-white/80" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-medium text-white/80">Inspektur</p>
 <p className="font-semibold text-white text-xs truncate">{inspection.user?.full_name}</p>
 {inspection.occupation ? (
 <div className="flex items-center gap-1 mt-0.5">
 <Briefcase className="w-3 h-3 flex-shrink-0" style={{ color: inspection.occupation.color || '#6b7280' }} />
 <span
 className="text-xs font-semibold truncate"
 style={{ color: inspection.occupation.color || '#6b7280' }}
 >
 {inspection.occupation.display_name}
 </span>
 </div>
 ) : (
 <p className="text-xs text-white/70 truncate">{inspection.user?.email}</p>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Component Ratings */}
 <div>
 <h3 className="font-bold text-white mb-2 flex items-center space-x-1.5 text-sm">
 <ClipboardList className="w-4 h-4" />
 <span>Penilaian Komponen</span>
 </h3>
 <div className="space-y-1.5">
 {ratings.map((rating: ComponentRating, index: number) => {
 const component = INSPECTION_COMPONENTS.find(c => c.id === rating.component);
 if (!component) return null;

 // Handle unavailable components
 if (rating.isAvailable === false) {
 return (
 <motion.div
 key={index}
 className="rounded-lg px-3 py-2 border bg-white/10 border-white/15"
 {...slideInLeft}
 transition={{
 ...slideInLeft.transition,
 delay: index * STAGGER_DELAY,
 }}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-1.5">
 {(() => {
  const iconName = inspectionMode === 'genz' ? component.iconGenZ : component.icon;
  const IconComp = (Icons as any)[iconName];
  return IconComp ? <IconComp className="w-4 h-4 text-white/80" /> : <HelpCircle className="w-4 h-4 text-white/80" />;
 })()}
 <span className="text-sm font-medium text-white">
 {component.labelGenZ || component.label}
 </span>
 </div>
 <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
 <SkipForward className="w-4 h-4 text-white/50" />
 <span className="text-xs font-medium text-white/50">Tidak Ada</span>
 </div>
 </div>
 </motion.div>
 );
 }

 return (
 <motion.div
 key={index}
 className={`rounded-lg px-3 py-2 border ${getChoiceColor(rating.choice)}`}
 {...slideInLeft}
 transition={{
 ...slideInLeft.transition,
 delay: index * STAGGER_DELAY,
 }}
 whileHover={{ scale: 1.01, x: 1 }}
 whileTap={{ scale: 0.995 }}
 >
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <div className="flex items-center space-x-1.5">
 {(() => {
  const iconName = inspectionMode === 'genz' ? component.iconGenZ : component.icon;
  const IconComp = (Icons as any)[iconName];
  return IconComp ? <IconComp className="w-4 h-4 text-white/80" /> : <HelpCircle className="w-4 h-4 text-white/80" />;
 })()}
 <span className="text-sm font-medium text-white">
 {component.labelGenZ || component.label}
 </span>
 </div>
 {rating.notes && (
 <div className="flex items-start gap-1.5 mt-1 pl-6">
 <MessageSquare className="w-3 h-3 text-white/70 mt-0.5 flex-shrink-0" />
 <p className="text-xs text-white/70">{rating.notes}</p>
 </div>
 )}
 </div>
 <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
 {(() => {
  const ChoiceIcon = getChoiceIcon(rating.choice);
  return <ChoiceIcon className={`w-4 h-4 ${getChoiceIconColor(rating.choice)}`} />;
 })()}
 <span className="text-xs font-semibold">
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
 <div className="bg-orange-500/15 border border-orange-400/25 rounded-lg px-3 py-2">
 <div className="flex items-start space-x-2">
 <AlertCircle className="w-4 h-4 text-orange-300 mt-0.5 flex-shrink-0" />
 <div>
 <h4 className="font-semibold text-white text-sm">Masalah Ditemukan</h4>
 <p className="text-xs text-white/70 mt-0.5">{issues.description}</p>
 </div>
 </div>
 </div>
 )}

 {/* Maintenance Required */}
 {maintenance && maintenance.required && (
 <div className={`
 border rounded-lg px-3 py-2
 ${maintenance.priority === 'urgent'
 ? 'bg-red-500/15 border-red-400/25'
 : maintenance.priority === 'high'
 ? 'bg-orange-500/15 border-orange-400/25'
 : maintenance.priority === 'medium'
 ? 'bg-yellow-500/15 border-yellow-400/25'
 : 'bg-blue-500/15 border-blue-400/25'
 }
 `}>
 <div className="flex items-center space-x-2">
 <Wrench className="w-4 h-4 text-white/80 flex-shrink-0" />
 <div>
 <h4 className="font-semibold text-white text-sm">Perlu Perbaikan</h4>
 <p className="text-xs text-white/80">
 Prioritas: <span className="font-semibold capitalize">{maintenance.priority}</span>
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Photos */}
 {inspection.photo_urls && inspection.photo_urls.length > 0 && (
 <div>
 <h3 className="font-bold text-white mb-2 flex items-center space-x-1.5 text-sm">
 <Camera className="w-4 h-4" />
 <span>Foto Dokumentasi ({inspection.photo_urls.length})</span>
 </h3>
 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
 {inspection.photo_urls.map((url, idx) => (
 <motion.button
 key={idx}
 onClick={() => handlePhotoClick(idx)}
 className="w-full aspect-square rounded-lg overflow-hidden shadow-sm cursor-pointer group relative"
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
 <Camera className="w-5 h-5 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
 </div>
 </motion.button>
 ))}
 </div>
 </div>
 )}

 {/* General Notes */}
 {inspection.notes && (
 <div className="bg-white/10 rounded-lg px-3 py-2">
 <div className="flex items-start space-x-2">
 <FileText className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
 <div>
 <h4 className="font-semibold text-white text-sm">Catatan Umum</h4>
 <p className="text-xs text-white/80 mt-0.5">{inspection.notes}</p>
 </div>
 </div>
 </div>
 )}

 {/* Bottom spacer */}
 <div className="h-2" />
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