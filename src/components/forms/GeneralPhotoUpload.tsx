// src/components/forms/GeneralPhotoUpload.tsx - Direct upload (no client compression)
import { useState, useRef } from 'react';
import { Camera, X, Clock, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { PhotoWithMetadata } from '../../types/inspection.types';

interface GeneralPhotoUploadProps {
  photos: PhotoWithMetadata[];
  onPhotosChange: (photos: PhotoWithMetadata[]) => void;
  maxPhotos?: number;
  genZMode?: boolean;
  locationName: string;
}

export const GeneralPhotoUpload = ({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  genZMode = false,
  locationName,
}: GeneralPhotoUploadProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // ✅ Handle CAMERA capture - Watermark only (compression handled by Cloudinary)
  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setPermissionError(null);

    try {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log(`📸 Camera photo: ${fileSizeMB}MB (will be optimized by Cloudinary on upload)`);

      // Add watermark to original file (compression happens server-side later)
      const watermarkedBlob = await addWatermarkToPhoto(file, {
        timestamp: new Date().toISOString(),
        locationName,
      });
      console.log(`🏷️ Watermarked: ${(watermarkedBlob.size / 1024 / 1024).toFixed(2)}MB`);

      const preview = URL.createObjectURL(watermarkedBlob);
      const watermarkedFile = new File([watermarkedBlob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });

      const photoMetadata: PhotoWithMetadata = {
        file: watermarkedFile,
        preview,
        timestamp: new Date().toISOString(),
      };

      onPhotosChange([...photos, photoMetadata]);

      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }

    } catch (error: any) {
      console.error('Error processing camera photo:', error);

      // Show detailed error on screen for mobile debugging
      const errorMsg = genZMode
        ? `Gagal proses foto: ${error.message || 'Unknown error'}`
        : `Photo processing failed: ${error.message || 'Unknown error'}`;

      setPermissionError(errorMsg);

      // Fallback: add without watermark
      const preview = URL.createObjectURL(file);
      onPhotosChange([...photos, {
        file,
        preview,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsProcessing(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  // ✅ Handle GALLERY selection - Watermark only (compression handled by Cloudinary)
  const handleGallerySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setPermissionError(null);

    try {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log(`🖼️ Gallery photo: ${fileSizeMB}MB (will be optimized by Cloudinary on upload)`);

      // Add watermark to original file (compression happens server-side later)
      const watermarkedBlob = await addWatermarkToPhoto(file, {
        timestamp: new Date().toISOString(),
        locationName,
      });
      console.log(`🏷️ Watermarked: ${(watermarkedBlob.size / 1024 / 1024).toFixed(2)}MB`);

      const preview = URL.createObjectURL(watermarkedBlob);
      const watermarkedFile = new File([watermarkedBlob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });

      const photoMetadata: PhotoWithMetadata = {
        file: watermarkedFile,
        preview,
        timestamp: new Date().toISOString(),
      };

      onPhotosChange([...photos, photoMetadata]);

    } catch (error: any) {
      console.error('Error processing gallery photo:', error);

      // Show detailed error on screen for mobile debugging
      const errorMsg = genZMode
        ? `Gagal proses foto: ${error.message || 'Unknown error'}`
        : `Photo processing failed: ${error.message || 'Unknown error'}`;

      setPermissionError(errorMsg);

      // Fallback: add without watermark
      const preview = URL.createObjectURL(file);
      onPhotosChange([...photos, {
        file,
        preview,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsProcessing(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-3">
      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.preview}
                alt={`Photo ${index + 1}`}
                className="w-full aspect-[4/3] object-cover rounded-xl border-2 border-gray-200"
              />

              {/* Metadata badge */}
              <div className="absolute bottom-2 right-2">
                <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(photo.timestamp), 'HH:mm')}</span>
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Permission Error */}
      {permissionError && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800">{permissionError}</p>
        </div>
      )}

      {/* ✅ TWO SEPARATE BUTTONS */}
      {canAddMore && (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className={`
              py-5 border-2 border-dashed rounded-xl
              flex flex-col items-center justify-center space-y-2
              transition-all
              ${isProcessing
                ? 'bg-gray-50 border-gray-300 cursor-wait'
                : genZMode
                  ? 'border-purple-300 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 text-purple-700'
                  : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 text-blue-700'
              }
            `}
          >
            <Camera className="w-7 h-7" />
            <div className="text-center">
              <p className="text-sm font-semibold">
                {genZMode ? '📸 Kamera' : '📸 Camera'}
              </p>
              <p className="text-xs opacity-75">
                {genZMode ? 'Ambil foto' : 'Take photo'}
              </p>
            </div>
          </button>

          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isProcessing}
            className={`
              py-5 border-2 border-dashed rounded-xl
              flex flex-col items-center justify-center space-y-2
              transition-all
              ${isProcessing
                ? 'bg-gray-50 border-gray-300 cursor-wait'
                : genZMode
                  ? 'border-purple-300 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 text-purple-700'
                  : 'border-green-300 bg-green-50 hover:border-green-400 hover:bg-green-100 text-green-700'
              }
            `}
          >
            <ImageIcon className="w-7 h-7" />
            <div className="text-center">
              <p className="text-sm font-semibold">
                {genZMode ? '🖼️ Galeri' : '🖼️ Gallery'}
              </p>
              <p className="text-xs opacity-75">
                {genZMode ? 'Pilih file' : 'Choose file'}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Camera Input (with capture) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Gallery Input (NO capture) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
      />

      {/* Info Text */}
      {canAddMore && (
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-600 font-medium">
            {photos.length}/{maxPhotos} photos
          </p>
          <p className="text-xs text-gray-500">
            {genZMode
              ? '✨ Watermark otomatis: Toilet, Building, Lantai, Tanggal & Jam'
              : '✨ Auto watermark: Toilet, Building, Floor, Date & Time'
            }
          </p>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto relative">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {genZMode ? 'Memproses Foto' : 'Processing Photo'}
            </h3>
            <p className="text-gray-600 mb-1">
              {genZMode ? 'Menambahkan watermark...' : 'Adding watermark...'}
            </p>
            <p className="text-sm text-gray-500">
              {genZMode ? 'Tunggu sebentar' : 'Please wait'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Helper: Extract EXIF orientation from image file
const getOrientation = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      if (view.getUint16(0, false) !== 0xFFD8) {
        return resolve(1); // Not JPEG, assume normal orientation
      }
      const length = view.byteLength;
      let offset = 2;
      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) return resolve(1);
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker === 0xFFE1) {
          const little = view.getUint16(offset + 8, false) === 0x4949;
          offset += 18;
          const tags = view.getUint16(offset - 2, little);
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + (i * 12), little) === 0x0112) {
              return resolve(view.getUint16(offset + (i * 12) + 8, little));
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
      return resolve(1);
    };
    reader.readAsArrayBuffer(file);
  });
};

// ✅ Watermark function - OPTIMIZED: Resize + Lower Quality + EXIF Fix
const addWatermarkToPhoto = async (
  file: File,
  metadata: {
    timestamp: string;
    locationName: string;
  }
): Promise<Blob> => {
  console.log(`🏷️ [WATERMARK] Starting watermark for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  const startTime = Date.now();

  // Get EXIF orientation first
  const orientation = await getOrientation(file);
  console.log(`🏷️ [WATERMARK] EXIF Orientation: ${orientation}`);

  return new Promise((resolve, reject) => {
    // Timeout after 30 seconds
    const timeoutId = setTimeout(() => {
      reject(new Error('Watermark timeout after 30s'));
    }, 30000);

    const reader = new FileReader();

    reader.onload = (e) => {
      console.log(`🏷️ [WATERMARK] File read complete, creating image...`);
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        console.log(`🏷️ [WATERMARK] Image loaded: ${img.width}x${img.height}px`);
        const canvas = document.createElement('canvas');

        // ✅ OPTIMIZATION: Resize to max 1280px (saves ~30-50% file size)
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
          console.log(`📐 Resized: ${img.width}x${img.height} → ${width}x${height}`);
        }

        // 🔧 Handle EXIF orientation (fix camera photos)
        // Orientations 5,6,7,8 need width/height swap
        if (orientation >= 5 && orientation <= 8) {
          canvas.width = height;
          canvas.height = width;
        } else {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Apply EXIF orientation transforms
        switch (orientation) {
          case 2: // Flip horizontal
            ctx.transform(-1, 0, 0, 1, width, 0);
            break;
          case 3: // Rotate 180°
            ctx.transform(-1, 0, 0, -1, width, height);
            break;
          case 4: // Flip vertical
            ctx.transform(1, 0, 0, -1, 0, height);
            break;
          case 5: // Rotate 90° + flip horizontal
            ctx.transform(0, 1, 1, 0, 0, 0);
            break;
          case 6: // Rotate 90° clockwise
            ctx.transform(0, 1, -1, 0, height, 0);
            break;
          case 7: // Rotate 270° + flip horizontal
            ctx.transform(0, -1, -1, 0, height, width);
            break;
          case 8: // Rotate 270° clockwise
            ctx.transform(0, -1, 1, 0, 0, width);
            break;
        }

        // Draw image with correct orientation
        ctx.drawImage(img, 0, 0, width, height);

        // Reset transformation for watermark (so watermark is always upright)
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Use corrected canvas dimensions for watermark
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Watermark config (use actual canvas dimensions after orientation fix)
        const fontSize = Math.max(20, canvasWidth * 0.03);
        const padding = Math.max(20, canvasWidth * 0.025);

        const date = format(new Date(metadata.timestamp), 'dd/MM/yyyy');
        const time = format(new Date(metadata.timestamp), 'HH:mm:ss');

        // ✅ Simple watermark: Location (from database) + Date + Time
        const lines = [
          `📍 ${metadata.locationName}`,
          `📅 ${date} ⏰ ${time}`,
        ];

        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const lineHeight = fontSize * 1.4;
        const boxHeight = lines.length * lineHeight + padding * 2;

        // Draw watermark box (use canvas dimensions)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(padding, canvasHeight - boxHeight - padding, maxWidth + padding * 3, boxHeight);

        // Draw text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        lines.forEach((line, i) => {
          ctx.fillText(line, padding * 2, canvasHeight - boxHeight - padding + lineHeight * (i + 1));
        });

        // Draw branding
        ctx.font = `bold ${fontSize * 0.9}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const brandText = 'TOILET CHECK ✓';
        const brandWidth = ctx.measureText(brandText).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(canvasWidth - brandWidth - padding * 3, padding, brandWidth + padding * 2, lineHeight * 1.8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillText(brandText, canvasWidth - brandWidth - padding * 2, padding + lineHeight * 1.2);

        // ✅ OPTIMIZATION: Use WebP format (30-40% smaller than JPEG with same quality)
        console.log(`🏷️ [WATERMARK] Converting to blob...`);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeoutId);
            if (blob) {
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
              const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
              console.log(`✅ [WATERMARK] Complete in ${elapsed}s (${sizeMB}MB)`);
              resolve(blob);
            } else {
              reject(new Error('Failed to create watermarked photo'));
            }
          },
          'image/webp',
          0.85
        );
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        console.error('❌ [WATERMARK] Failed to load image');
        reject(new Error('Failed to load image'));
      };
    };

    reader.onerror = () => {
      clearTimeout(timeoutId);
      console.error('❌ [WATERMARK] Failed to read file');
      reject(new Error('Failed to read file'));
    };

    console.log(`🏷️ [WATERMARK] Reading file...`);
    reader.readAsDataURL(file);
  });
};
