// src/components/forms/RatingSelector.tsx
import { useState } from 'react';
import { InspectionComponentConfig, RatingChoice } from '../../types/inspection.types';
import { Camera, MessageSquare } from 'lucide-react';
import * as Icons from 'lucide-react';

interface RatingSelectorProps {
 config: InspectionComponentConfig;
 isAvailable: boolean; // NEW: Track if component exists
 onAvailabilityChange: (available: boolean) => void; // NEW: Toggle availability
 value: RatingChoice | null;
 onChange: (choice: RatingChoice) => void;
 onPhotoAdd?: () => void;
 hasPhoto?: boolean;
 genZMode?: boolean;
 notes?: string;
 onNotesChange?: (notes: string) => void;
}

export const RatingSelector = ({
 config,
 isAvailable,
 onAvailabilityChange,
 value,
 onChange,
 onPhotoAdd,
 hasPhoto,
 genZMode = false,
 notes,
 onNotesChange,
}: RatingSelectorProps) => {
 const [showNotes, setShowNotes] = useState(value === 'other');
 const choices = genZMode ? config.choices.genZ : config.choices.professional;
 const label = genZMode ? config.labelGenZ : config.label;

 // Get Lucide icon component for professional mode
 const IconComponent = !genZMode && config.icon ? (Icons as any)[config.icon] : null;

 // Auto-show notes when "other" is selected
 const handleChoiceChange = (choice: RatingChoice) => {
 onChange(choice);
 if (choice === 'other') {
 setShowNotes(true);
 }
 };

 return (
 <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/10">
 {/* Header */}
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center space-x-3">
 <div
 className={`
 w-12 h-12 rounded-xl flex items-center justify-center text-2xl
 ${genZMode ? 'bg-purple-500/20' : 'bg-blue-500/20'}
 `}
 >
 {(() => {
  const iconToUse = genZMode ? config.iconGenZ : config.icon;
  const ResolvedIcon = iconToUse ? (Icons as any)[iconToUse] : null;
  return ResolvedIcon ? (
   <ResolvedIcon className={`w-6 h-6 ${genZMode ? 'text-white' : 'text-blue-400'}`} />
  ) : null;
 })()}
 </div>
 <div>
 <h3 className={`font-semibold ${genZMode ? 'text-white' : 'text-white'}`}>
 {label}
 {config.required && <span className="text-red-500 ml-1">*</span>}
 </h3>
 {!config.required && <span className="text-xs text-white/50">Opsional</span>}
 </div>
 </div>

 </div>

 {/* Availability Toggle */}
 <div className="mb-3 pb-3 border-b border-white/10">
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => onAvailabilityChange(true)}
 className={`
 flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all border
 ${
 isAvailable
 ? 'bg-green-500/10 border-green-500 text-green-400'
 : 'bg-white/5 border-white/15 text-white/60 hover:border-white/30'
 }
 `}
 >
 Ada
 </button>
 <button
 type="button"
 onClick={() => onAvailabilityChange(false)}
 className={`
 flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all border
 ${
 !isAvailable
 ? 'bg-white/10 border-white/30 text-white'
 : 'bg-white/5 border-white/15 text-white/60 hover:border-white/30'
 }
 `}
 >
 Tidak Ada
 </button>
 </div>
 </div>

 {/* Rating Section - Only show if component is available */}
 {isAvailable ? (
 <>
 {/* 3-Choice Buttons */}
 <div className="grid grid-cols-3 gap-2 mb-3">
 {(['good', 'normal', 'bad'] as RatingChoice[]).map((choice) => {
 const isSelected = value === choice;
 const buttonStyle = getChoiceStyle(choice, isSelected, genZMode);

 return (
 <button
 key={choice}
 type="button"
 onClick={() => handleChoiceChange(choice)}
 className={`
 py-2 px-2 rounded-lg text-center transition-all
 border font-medium text-xs
 ${buttonStyle}
 ${isSelected ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'}
 `}
 >
 <div className="flex flex-col items-center space-y-0.5">
 {(() => {
  const iconName = getChoiceIcon(choice, config.category);
  const IconComponent = iconName ? (Icons as any)[iconName] : null;
  return IconComponent ? (
   <IconComponent className="w-5 h-5" />
  ) : null;
 })()}
 <span className="leading-tight">{choices[choice]}</span>
 </div>
 </button>
 );
 })}
 </div>

 </>
 ) : (
 <div className="text-center py-6 text-white/50">
 <p className="text-sm font-medium">
 {genZMode ? 'Komponen ini tidak tersedia' : 'Component not available'}
 </p>
 <p className="text-xs mt-1">
 {genZMode ? 'Tidak akan masuk penilaian' : 'Will not be included in scoring'}
 </p>
 </div>
 )}

 {/* Notes Section (Required for "other") - Only show if available */}
 {isAvailable && showNotes && (
 <div className="mt-3 pt-3 border-t border-white/10">
 <textarea
 value={notes || ''}
 onChange={(e) => onNotesChange?.(e.target.value)}
 placeholder={
 value === 'other'
 ? 'Jelasin detailnya dong...'
 : 'Catatan tambahan (opsional)...'
 }
 className={`
 w-full px-3 py-2 border rounded-xl focus:ring-2 resize-none
 ${
 value === 'other'
 ? 'border-orange-300 focus:ring-orange-500 focus:border-orange-500'
 : 'border-white/15 focus:ring-blue-500 focus:border-blue-500'
 }
 `}
 rows={3}
 required={value === 'other'}
 />
 {value !== 'other' && (
 <button
 type="button"
 onClick={() => setShowNotes(false)}
 className="text-sm text-white/50 hover:text-white/70 mt-1"
 >
 × Sembunyikan catatan
 </button>
 )}
 </div>
 )}

 {/* Show notes toggle (only when available, not "other" and notes hidden) */}
 {isAvailable && value && value !== 'other' && !showNotes && (
 <button
 type="button"
 onClick={() => setShowNotes(true)}
 className={`
 w-full mt-3 py-2 text-sm font-medium rounded-xl
 ${
 genZMode
 ? 'text-purple-400 hover:bg-purple-500/10'
 : 'text-blue-400 hover:bg-blue-500/10'
 }
 `}
 >
 + Tambah catatan
 </button>
 )}
 </div>
 );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getChoiceStyle = (
 choice: RatingChoice,
 isSelected: boolean,
 genZMode: boolean
): string => {
 if (!isSelected) {
 return 'bg-white/8 border-white/15 text-white/80 hover:border-white/30 hover:bg-white/10';
 }

 if (genZMode) {
 switch (choice) {
 case 'good':
 return 'bg-green-500/10 border-green-500 text-green-400';
 case 'normal':
 return 'bg-yellow-500/10 border-yellow-500 text-yellow-400';
 case 'bad':
 return 'bg-red-500/10 border-red-500 text-red-400';
 default:
 return 'bg-white border-gray-200 text-gray-700';
 }
 } else {
 switch (choice) {
 case 'good':
 return 'bg-green-500/10 border-green-500 text-green-400';
 case 'normal':
 return 'bg-yellow-500/10 border-yellow-500 text-yellow-400';
 case 'bad':
 return 'bg-red-500/10 border-red-500 text-red-400';
 default:
 return 'bg-white border-gray-200 text-gray-700';
 }
 }
};

const getChoiceIcon = (
 choice: RatingChoice,
 category: 'aroma' | 'visual' | 'availability' | 'functional'
): string => {
 // Aroma category
 if (category === 'aroma') {
 switch (choice) {
 case 'good':
 return 'Flower2';
 case 'normal':
 return 'Minus';
 case 'bad':
 return 'Skull';
 }
 }

 // Visual category
 if (category === 'visual') {
 switch (choice) {
 case 'good':
 return 'Sparkles';
 case 'normal':
 return 'Minus';
 case 'bad':
 return 'Trash2';
 }
 }

 // Availability category
 if (category === 'availability') {
 switch (choice) {
 case 'good':
 return 'CheckCircle2';
 case 'normal':
 return 'AlertTriangle';
 case 'bad':
 return 'XCircle';
 }
 }

 // Functional category
 if (category === 'functional') {
 switch (choice) {
 case 'good':
 return 'CheckCircle2';
 case 'normal':
 return 'AlertTriangle';
 case 'bad':
 return 'XCircle';
 }
 }

 return 'MessageCircle';
};