// src/components/forms/InspectionSuccessModal.tsx
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, QrCode, TrendingUp } from 'lucide-react';

interface InspectionSuccessModalProps {
  isOpen: boolean;
  score: number;
  locationName: string;
}

export const InspectionSuccessModal = ({
  isOpen,
  score,
  locationName,
}: InspectionSuccessModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 75) return 'from-blue-500 to-indigo-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Luar Biasa!';
    if (score >= 75) return 'Bagus!';
    if (score >= 60) return 'Cukup Memuaskan';
    return 'Perlu Ditingkatkan';
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-fadeIn" />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-scaleIn overflow-hidden">
          {/* Success Icon & Score */}
          <div className={`bg-gradient-to-br ${getScoreGradient(score)} p-8 text-center relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

            {/* Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-xl">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Inspeksi Selesai!
              </h2>

              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">Skor: {score}</span>
              </div>

              <p className="text-white/90 text-sm mt-2 font-medium">
                {getScoreLabel(score)}
              </p>
            </div>
          </div>

          {/* Location Info */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <p className="text-sm text-gray-600">Inspeksi selesai untuk:</p>
            <p className="font-semibold text-gray-900 truncate">{locationName}</p>
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            <p className="text-center text-sm text-gray-600 mb-4">
              Mau ngapain selanjutnya?
            </p>

            {/* Dashboard Button */}
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Lihat Dashboard</span>
            </button>

            {/* Scan Next Button */}
            <button
              onClick={() => navigate('/scan', { replace: true })}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Scan Lokasi Berikutnya</span>
            </button>

            {/* Hint Text */}
            <p className="text-xs text-gray-500 text-center pt-2">
              💡 Tip: Dashboard nampilin hasil dan statistik terbaru lo
            </p>
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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};
