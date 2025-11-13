// src/components/forms/RatingSelector.tsx
import { useState } from 'react';
import { InspectionComponentConfig, RatingChoice, STAR_RATINGS } from '../../types/inspection.types';
import { Camera, Star } from 'lucide-react';
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
  const [showNotes, setShowNotes] = useState(false);
  const label = genZMode ? config.labelGenZ : config.label;

  // Get Lucide icon component for professional mode
  const IconComponent = !genZMode && config.icon ? (Icons as any)[config.icon] : null;

  // Handle star selection
  const handleStarChange = (starValue: 1 | 2 | 3 | 4 | 5) => {
    onChange(starValue);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${genZMode ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-blue-50'}
          `}
          >
            {genZMode ? (
              config.iconGenZ
            ) : IconComponent ? (
              <IconComponent className="w-6 h-6 text-blue-600" />
            ) : (
              config.icon
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${genZMode ? 'text-purple-900' : 'text-gray-900'}`}>
              {label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {!config.required && <span className="text-xs text-gray-500">Opsional</span>}
          </div>
        </div>

        {/* Photo Button */}
        {config.allowPhoto && isAvailable && (
          <button
            type="button"
            onClick={onPhotoAdd}
            className={`
              p-2 rounded-xl transition-all
              ${
                hasPhoto
                  ? 'bg-green-100 text-green-600'
                  : genZMode
                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* NEW: Availability Toggle */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-sm text-gray-600 mb-2">
          {genZMode ? 'Ada nggak nih komponennya?' : 'Is this component available?'}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onAvailabilityChange(true)}
            className={`
              flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all border-2
              ${
                isAvailable
                  ? genZMode
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 text-green-900'
                    : 'bg-green-50 border-green-500 text-green-900'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
              }
            `}
          >
            ✅ {genZMode ? 'Ada' : 'Available'}
          </button>
          <button
            type="button"
            onClick={() => onAvailabilityChange(false)}
            className={`
              flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all border-2
              ${
                !isAvailable
                  ? genZMode
                    ? 'bg-gradient-to-br from-gray-100 to-slate-100 border-gray-400 text-gray-900'
                    : 'bg-gray-100 border-gray-500 text-gray-900'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
              }
            `}
          >
            ❌ {genZMode ? 'Tidak Ada' : 'Not Available'}
          </button>
        </div>
      </div>

      {/* Rating Section - Only show if component is available */}
      {isAvailable ? (
        <>
          {/* 5-Star Rating Buttons */}
          <div className="space-y-2">
            {STAR_RATINGS.map((rating) => {
              const isSelected = value === rating.value;

              return (
                <button
                  key={rating.value}
                  type="button"
                  onClick={() => handleStarChange(rating.value)}
                  className={`
                    w-full p-4 rounded-xl text-left transition-all border-2
                    ${isSelected
                      ? getStarButtonStyle(rating.color, true, genZMode)
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Stars */}
                    <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < rating.value
                              ? isSelected
                                ? 'fill-current text-yellow-500'
                                : 'fill-current text-gray-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Label & Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{rating.emoji}</span>
                        <span className="font-semibold text-gray-900">
                          {rating.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {rating.description}
                      </p>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm font-medium">
            {genZMode ? '⏭️ Komponen ini tidak tersedia' : '⏭️ Component not available'}
          </p>
          <p className="text-xs mt-1">
            {genZMode ? 'Tidak akan masuk penilaian' : 'Will not be included in scoring'}
          </p>
        </div>
      )}

      {/* Notes Section (Optional for any rating) - Only show if available */}
      {isAvailable && showNotes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <textarea
            value={notes || ''}
            onChange={(e) => onNotesChange?.(e.target.value)}
            placeholder="Catatan tambahan (opsional)..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
          <button
            type="button"
            onClick={() => setShowNotes(false)}
            className="text-sm text-gray-500 hover:text-gray-700 mt-1"
          >
            × Sembunyikan catatan
          </button>
        </div>
      )}

      {/* Show notes toggle (only when available and notes hidden) */}
      {isAvailable && value && !showNotes && (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className={`
            w-full mt-3 py-2 text-sm font-medium rounded-xl
            ${
              genZMode
                ? 'text-purple-600 hover:bg-purple-50'
                : 'text-blue-600 hover:bg-blue-50'
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

const getStarButtonStyle = (
  color: string,
  isSelected: boolean,
  genZMode: boolean
): string => {
  if (genZMode) {
    switch (color) {
      case 'green':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-md';
      case 'blue':
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-md';
      case 'yellow':
        return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 shadow-md';
      case 'orange':
        return 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-400 shadow-md';
      case 'red':
        return 'bg-gradient-to-br from-red-50 to-pink-50 border-red-400 shadow-md';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  } else {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-500 shadow-md';
      case 'blue':
        return 'bg-blue-50 border-blue-500 shadow-md';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-500 shadow-md';
      case 'orange':
        return 'bg-orange-50 border-orange-500 shadow-md';
      case 'red':
        return 'bg-red-50 border-red-500 shadow-md';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  }
};