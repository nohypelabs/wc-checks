// src/lib/cloudinary.ts
import imageCompression from 'browser-image-compression';

// Environment variables for Cloudinary
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'toilet-inspections';

// Validate environment variables
const validateCloudinaryConfig = (): void => {
  const missingVars: string[] = [];

  if (!CLOUDINARY_CLOUD_NAME) missingVars.push('VITE_CLOUDINARY_CLOUD_NAME');
  if (!CLOUDINARY_UPLOAD_PRESET) missingVars.push('VITE_CLOUDINARY_UPLOAD_PRESET');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Cloudinary environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all variables are set.'
    );
  }
};

// Validate on module load
validateCloudinaryConfig();

/**
 * Compress image before upload - AGGRESSIVE FOR CAMERA PHOTOS
 */
export const compressImage = async (file: File): Promise<File> => {
  const startTime = Date.now();
  const originalSizeMB = file.size / 1024 / 1024;

  console.log(`🖼️ Original photo: ${originalSizeMB.toFixed(2)}MB (${file.type})`);

  // Aggressive compression for large camera photos
  const options = {
    maxSizeMB: 0.3, // Max 300KB (very aggressive)
    maxWidthOrHeight: 1080, // 1080px (HD quality, enough for inspections)
    useWebWorker: true,
    fileType: 'image/webp', // WebP has better compression
    initialQuality: 0.7, // 70% quality (balance between size and clarity)
    alwaysKeepResolution: false, // Allow downscaling for better compression
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const compressedSizeMB = compressedFile.size / 1024 / 1024;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(0);

    console.log(`✅ Compressed: ${originalSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (${reduction}% smaller) in ${duration}s`);
    return compressedFile;
  } catch (error) {
    console.error('❌ Compression error:', error);
    return file; // Fallback to original
  }
};


// src/lib/cloudinary.ts - FIXED WITH BATCH UPLOAD

/**
 * Upload single file to Cloudinary - MOBILE OPTIMIZED
 * Includes timeout for slow mobile networks
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', CLOUDINARY_FOLDER);

  try {
    // Mobile-friendly timeout: 60 seconds for slow 3G/4G
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    console.log(`📤 Uploading ${file.name} (${(file.size / 1024).toFixed(0)}KB)...`);
    const startTime = Date.now();

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Uploaded ${file.name} in ${elapsed}s`);

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Upload failed');

    return data.secure_url;
  } catch (error: any) {
    console.error(`❌ Upload error for ${file.name}:`, error);

    // Better error messages for mobile users
    if (error.name === 'AbortError') {
      throw new Error('Upload timeout (slow connection). Please try again.');
    }

    throw new Error(error.message || 'Failed to upload photo');
  }
};

/**
 * Batch upload with concurrency limit and progress tracking - MOBILE OPTIMIZED
 * Uses Promise.allSettled to continue uploading even if some files fail
 * Reduced concurrency for mobile network stability
 */
export const batchUploadToCloudinary = async (
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const CONCURRENT_UPLOADS = 3; // ⚡ Upload 3 at a time for faster processing
  const results: string[] = [];
  const failedFiles: Array<{ fileName: string; error: string }> = [];
  let completed = 0;

  for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
    const batch = files.slice(i, i + CONCURRENT_UPLOADS);

    // Use Promise.allSettled instead of Promise.all
    // This allows remaining uploads to continue even if some fail
    const batchResults = await Promise.allSettled(
      batch.map((file, index) =>
        uploadToCloudinary(file).catch(error => {
          failedFiles.push({
            fileName: file.name,
            error: error.message || 'Unknown error'
          });
          throw error;
        })
      )
    );

    // Extract successful uploads
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Failed to upload ${batch[index].name}:`, result.reason);
      }
    });

    completed += batch.length;

    if (onProgress) {
      onProgress(completed, files.length);
    }
  }

  // Log summary if there were failures
  if (failedFiles.length > 0) {
    console.warn(
      `⚠️ Upload completed with ${failedFiles.length} failure(s) out of ${files.length} file(s):`,
      failedFiles
    );
  } else {
    console.log(`✅ All ${files.length} file(s) uploaded successfully`);
  }

  return results;
};