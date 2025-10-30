// src/components/reports/PhotoReviewModal.tsx
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface PhotoReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  initialIndex?: number;
}

export const PhotoReviewModal = ({
  isOpen,
  onClose,
  photos,
  initialIndex = 0,
}: PhotoReviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) {
      setIsZoomed(false);
      setIsLoading(true);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsLoading(true);
      setIsZoomed(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsLoading(true);
      setIsZoomed(false);
    }
  };

  const handleDownload = async () => {
    const url = photos[currentIndex];
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `inspection-photo-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110 active:scale-95 group"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Photo Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
          <p className="text-white font-medium text-sm">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>

        {/* Action Buttons - Top Left */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {/* Zoom Toggle */}
          <button
            onClick={toggleZoom}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110 active:scale-95"
            aria-label={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? (
              <ZoomOut className="w-5 h-5 text-white" />
            ) : (
              <ZoomIn className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110 active:scale-95"
            aria-label="Download"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation - Previous */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110 active:scale-95 z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Navigation - Next */}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110 active:scale-95 z-10"
            aria-label="Next photo"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Photo Container */}
        <div
          className={`relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center transition-all duration-300 ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
        >
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Photo */}
          <img
            src={photos[currentIndex]}
            alt={`Foto ${currentIndex + 1}`}
            className={`
              max-w-full max-h-full object-contain rounded-2xl shadow-2xl
              transition-all duration-500 ease-out
              ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
              ${isZoomed ? 'scale-150 md:scale-125' : 'scale-100'}
            `}
            onLoad={() => setIsLoading(false)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Thumbnail Strip - Bottom */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-w-full overflow-x-auto px-4">
            <div className="flex gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setIsLoading(true);
                    setIsZoomed(false);
                  }}
                  className={`
                    relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0
                    transition-all duration-300
                    ${
                      index === currentIndex
                        ? 'ring-4 ring-white scale-110 shadow-xl'
                        : 'ring-2 ring-white/30 hover:ring-white/60 opacity-60 hover:opacity-100'
                    }
                  `}
                >
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-white/20" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Global Styles for Animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};
