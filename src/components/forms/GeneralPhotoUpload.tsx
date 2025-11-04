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

  // ✅ Handle CAMERA capture - NO WATERMARK for reliability
  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    // Just use original photo - no watermark, no processing
    onPhotosChange([...photos, {
      file,
      preview: URL.createObjectURL(file),
      timestamp: new Date().toISOString(),
    }]);

    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }

    setIsProcessing(false);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
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

      // Create clean filename (no special chars that might confuse Cloudinary)
      const cleanFileName = `gallery_${Date.now()}.webp`;
      const watermarkedFile = new File([watermarkedBlob], cleanFileName, {
        type: 'image/webp',
        lastModified: Date.now()
      });

      console.log(`🖼️ Final gallery file: ${cleanFileName} (${(watermarkedFile.size / 1024 / 1024).toFixed(2)}MB, clean WebP)`);

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

// ✅ Helper: Extract EXIF orientation from image file (SAFE - never fails)
const getOrientation = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    // Timeout protection - default to 1 after 3 seconds
    const timeoutId = setTimeout(() => {
      console.log('🏷️ [EXIF] Timeout - using default orientation');
      resolve(1);
    }, 3000);

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          clearTimeout(timeoutId);

          if (!e.target?.result) {
            console.log('🏷️ [EXIF] No result - using default orientation');
            return resolve(1);
          }

          const view = new DataView(e.target.result as ArrayBuffer);

          // Check if JPEG (starts with 0xFFD8)
          if (view.getUint16(0, false) !== 0xFFD8) {
            console.log('🏷️ [EXIF] Not JPEG - using default orientation');
            return resolve(1);
          }

          const length = view.byteLength;
          let offset = 2;

          while (offset < length) {
            if (view.getUint16(offset + 2, false) <= 8) {
              console.log('🏷️ [EXIF] Invalid marker size - using default orientation');
              return resolve(1);
            }

            const marker = view.getUint16(offset, false);
            offset += 2;

            if (marker === 0xFFE1) {
              // EXIF marker found
              if (offset + 10 > length) return resolve(1);

              const little = view.getUint16(offset + 8, false) === 0x4949;
              offset += 18;

              if (offset >= length) return resolve(1);

              const tags = view.getUint16(offset - 2, little);

              for (let i = 0; i < tags; i++) {
                const entryOffset = offset + (i * 12);
                if (entryOffset + 12 > length) break;

                if (view.getUint16(entryOffset, little) === 0x0112) {
                  const orientationValue = view.getUint16(entryOffset + 8, little);
                  console.log(`🏷️ [EXIF] Found orientation: ${orientationValue}`);
                  return resolve(orientationValue);
                }
              }
            } else if ((marker & 0xFF00) !== 0xFF00) {
              break;
            } else {
              if (offset >= length) break;
              offset += view.getUint16(offset, false);
            }
          }

          console.log('🏷️ [EXIF] No orientation tag - using default');
          return resolve(1);
        } catch (parseError) {
          clearTimeout(timeoutId);
          console.warn('🏷️ [EXIF] Parse error - using default orientation:', parseError);
          resolve(1);
        }
      };

      reader.onerror = () => {
        clearTimeout(timeoutId);
        console.warn('🏷️ [EXIF] Read error - using default orientation');
        resolve(1);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('🏷️ [EXIF] Exception - using default orientation:', error);
      resolve(1);
    }
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

  // Skip EXIF for faster processing
  const orientation = 1;

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Watermark timeout'));
    }, 15000); // 15s timeout for camera photos

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        console.log(`🏷️ [WATERMARK] File read complete, creating image...`);

        if (!e.target?.result) {
          clearTimeout(timeoutId);
          reject(new Error('Failed to read file'));
          return;
        }

        const img = new Image();
        img.src = e.target.result as string;

        img.onload = () => {
          try {
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

            // Validate dimensions
            if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
              clearTimeout(timeoutId);
              reject(new Error('Invalid image dimensions'));
              return;
            }

            // 🔧 Handle EXIF orientation (fix camera photos)
            // Orientations 5,6,7,8 need width/height swap
            try {
              if (orientation >= 5 && orientation <= 8) {
                canvas.width = height;
                canvas.height = width;
              } else {
                canvas.width = width;
                canvas.height = height;
              }
            } catch (canvasError) {
              console.warn('🏷️ [WATERMARK] Canvas sizing error, using default:', canvasError);
              canvas.width = width;
              canvas.height = height;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              clearTimeout(timeoutId);
              reject(new Error('Could not get canvas context'));
              return;
            }

            // Apply EXIF orientation transforms (wrapped in try-catch)
            try {
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
                default:
                  // Orientation 1 or invalid - no transform needed
                  break;
              }
            } catch (transformError) {
              console.warn('🏷️ [WATERMARK] Transform error, continuing with default:', transformError);
              // Continue without transform
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

            // Use JPEG for better compatibility (WebP can hang on some devices)
            const blobPromise = new Promise<Blob>((resolveBlob, rejectBlob) => {
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolveBlob(blob);
                  } else {
                    rejectBlob(new Error('toBlob returned null'));
                  }
                },
                'image/jpeg',
                0.85
              );
            });

            // Race between blob creation and 5s timeout
            const blob = await Promise.race([
              blobPromise,
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('toBlob timeout')), 5000)
              )
            ]);

            clearTimeout(timeoutId);
            resolve(blob);
          } catch (canvasProcessError) {
            clearTimeout(timeoutId);
            console.error('❌ [WATERMARK] Canvas processing error:', canvasProcessError);
            reject(canvasProcessError);
          }
        };

        img.onerror = () => {
          clearTimeout(timeoutId);
          console.error('❌ [WATERMARK] Failed to load image');
          reject(new Error('Failed to load image'));
        };
      } catch (readerError) {
        clearTimeout(timeoutId);
        console.error('❌ [WATERMARK] Reader error:', readerError);
        reject(readerError);
      }
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

// Compress image to target size in MB
const compressImage = async (file: File, targetMB: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');

        // Resize to max 1920px
        let width = img.width;
        let height = img.height;
        const MAX = 1920;

        if (width > MAX || height > MAX) {
          if (width > height) {
            height = (height / width) * MAX;
            width = MAX;
          } else {
            width = (width / height) * MAX;
            height = MAX;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality 0.8
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/webp',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
    };

    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};
