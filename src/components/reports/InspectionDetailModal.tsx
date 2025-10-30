// src/components/reports/InspectionDetailModal.tsx
import { X, MapPin, Clock, User, Camera, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { InspectionReport } from '../../hooks/useReports';
import { INSPECTION_COMPONENTS, calculateWeightedScore, getScoreStatus, ComponentRating } from '../../types/inspection.types';

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

export const InspectionDetailModal = ({
  isOpen,
  onClose,
  inspection,
}: InspectionDetailModalProps) => {
  if (!isOpen || !inspection) return null;

  const responses = inspection.responses as any;
  const score = getScoreFromResponses(responses);
  const scoreStatus = getScoreStatus(score);
  const ratings: ComponentRating[] = responses?.ratings || [];
  const issues = responses?.issues;
  const maintenance = responses?.maintenance;
  const inspectionMode = responses?.inspection_mode || 'professional';

  const formattedDate = format(new Date(inspection.inspection_date), 'EEEE, MMMM d, yyyy');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto z-50 max-h-[90vh] overflow-hidden">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
                🚽
              </div>
              <div>
                <h2 className="text-2xl font-bold">{inspection.location?.name}</h2>
                <p className="text-blue-100 text-sm">
                  {inspection.location?.building} • {inspection.location?.floor}
                </p>
              </div>
            </div>

            {/* Score Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-blue-100 text-sm">Inspection Score:</span>
                <div className="bg-white/90 px-4 py-2 rounded-full">
                  <span className="text-2xl font-bold text-blue-600">{score}</span>
                  <span className="text-sm text-gray-600 ml-1">/ 100</span>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {scoreStatus.emoji} {scoreStatus.label}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
            {/* Metadata */}
            <div className="space-y-3">
              {/* Date & Time */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Tanggal & Waktu Inspeksi</p>
                  <p className="font-medium text-gray-900">{formattedDate}</p>
                  <p className="text-sm text-gray-600">{inspection.inspection_time}</p>
                </div>
              </div>

              {/* Inspector Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <User className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Inspector</p>
                  <p className="font-medium text-gray-900">{inspection.user?.full_name}</p>
                  <p className="text-sm text-gray-600">{inspection.user?.email}</p>
                  {inspection.occupation && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {inspection.occupation.icon && (
                        <span className="text-base">{inspection.occupation.icon}</span>
                      )}
                      <span
                        className="text-sm font-medium"
                        style={{ color: inspection.occupation.color || '#6b7280' }}
                      >
                        {inspection.occupation.display_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inspection Mode */}
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700 font-medium">
                  <span>Mode: </span>
                  <span className="capitalize">{inspectionMode}</span>
                </div>
              </div>
            </div>

            {/* Component Ratings */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                <span>📋</span>
                <span>Component Ratings</span>
              </h3>
              <div className="space-y-3">
                {ratings.map((rating: ComponentRating, index: number) => {
                  const component = INSPECTION_COMPONENTS.find(c => c.id === rating.component);
                  if (!component) return null;

                  return (
                    <div key={index} className={`rounded-xl p-4 border-2 ${getChoiceColor(rating.choice)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xl">
                              {inspectionMode === 'genz' ? component.iconGenZ : component.icon}
                            </span>
                            <span className="font-medium text-gray-900">
                              {component.label}
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
                          <span className="text-sm font-medium capitalize">
                            {rating.choice}
                          </span>
                        </div>
                      </div>
                    </div>
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
                    <h4 className="font-semibold text-orange-900 mb-1">Issues Found</h4>
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
                      Maintenance Required
                    </h4>
                    <p className="text-sm text-gray-700">
                      Priority: <span className="font-semibold capitalize">{maintenance.priority}</span>
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
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full aspect-square rounded-xl overflow-hidden hover:opacity-80 hover:scale-105 transition-all shadow-md hover:shadow-xl"
                    >
                      <img
                        src={url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
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
                    <h4 className="font-semibold text-gray-900 mb-1">General Notes</h4>
                    <p className="text-sm text-gray-700">{inspection.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};