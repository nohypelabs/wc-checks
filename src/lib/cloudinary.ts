// src/lib/cloudinary.ts - DIRECT UPLOAD with Server-Side Transformations
// No client-side compression - Cloudinary handles optimization on their servers

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
 * 🔥 REMOVED CLIENT-SIDE COMPRESSION
 *
 * Why? Server-side transformation is faster and more efficient:
 * - No compression delay on client (instant upload start)
 * - Cloudinary servers are more powerful than mobile devices
 * - Saves battery and CPU on mobile devices
 * - Original quality preserved in Cloudinary storage
 *
 * Cloudinary automatically optimizes images on upload with the preset configuration.
 */

/**
 * Upload file directly to Cloudinary - Server-side transformation
 *
 * IMPORTANT: Transformation MUST be configured in the upload preset!
 * Go to: Cloudinary Dashboard → Settings → Upload → Upload Presets → [Your Preset]
 * Add "Incoming Transformation": width:1080, crop:limit, quality:auto:good, format:auto
 *
 * Cloudinary automatically optimizes based on preset configuration.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const fileSizeMB = file.size / 1024 / 1024;

  // Validate file size (warn if > 10MB, reject if > 20MB)
  if (fileSizeMB > 20) {
    throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB. Maximum 20MB allowed.`);
  }

  if (fileSizeMB > 10) {
    console.warn(`⚠️ Large file detected: ${fileSizeMB.toFixed(2)}MB. Upload may be slow.`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', CLOUDINARY_FOLDER);

  try {
    // ⚡ REDUCED timeout for faster failure detection (max 60s)
    const timeoutDuration = Math.max(30000, Math.min(60000, fileSizeMB * 8000));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`❌ [UPLOAD] Timeout after ${(timeoutDuration / 1000).toFixed(0)}s for ${file.name}`);
      controller.abort();
    }, timeoutDuration);

    console.log(`📤 [UPLOAD] Uploading ${file.name} (${fileSizeMB.toFixed(2)}MB)...`);
    console.log(`⏱️ [UPLOAD] Timeout: ${(timeoutDuration / 1000).toFixed(0)}s`);
    console.log(`🔄 [UPLOAD] Cloudinary will optimize based on preset configuration`);
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
    console.log(`✅ [UPLOAD] Response received for ${file.name} in ${elapsed}s`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [UPLOAD] Successfully uploaded ${file.name}`);

    return data.secure_url;
  } catch (error: any) {
    console.error(`❌ Upload error for ${file.name}:`, error);

    // Better error messages for mobile users
    if (error.name === 'AbortError') {
      throw new Error('Upload timeout - slow connection or file too large. Try again with better signal.');
    }

    if (error.message?.includes('fetch')) {
      throw new Error('Network error - check your internet connection and try again.');
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