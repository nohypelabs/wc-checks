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

  if (fileSizeMB > 20) {
    throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', CLOUDINARY_FOLDER);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s max

    console.log(`📤 Uploading ${file.name} (${fileSizeMB.toFixed(2)}MB)...`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ Upload failed: ${response.status}`);
      throw new Error(`Upload failed (${response.status})`);
    }

    const data = await response.json();
    console.log(`✅ Uploaded: ${file.name}`);
    return data.secure_url;
  } catch (error: any) {
    console.error(`❌ Upload error:`, error);

    if (error.name === 'AbortError') {
      throw new Error('Upload timeout (15s)');
    }

    throw new Error(error.message || 'Upload failed');
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
  console.log(`📤 Starting batch upload: ${files.length} files`);

  const CONCURRENT_UPLOADS = 1; // Upload 1 at a time for reliability
  const results: string[] = [];
  const errors: string[] = [];
  let completed = 0;

  for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
    const batch = files.slice(i, i + CONCURRENT_UPLOADS);

    console.log(`📤 Uploading batch ${i / CONCURRENT_UPLOADS + 1}/${Math.ceil(files.length / CONCURRENT_UPLOADS)}`);

    const batchResults = await Promise.allSettled(
      batch.map(file => uploadToCloudinary(file))
    );

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push(`${batch[idx].name}: ${result.reason}`);
      }
    });

    completed += batch.length;
    console.log(`✅ Progress: ${completed}/${files.length}`);

    if (onProgress) {
      onProgress(completed, files.length);
    }
  }

  if (errors.length > 0) {
    console.error(`❌ Upload errors:`, errors);
  }

  console.log(`✅ Batch upload complete: ${results.length}/${files.length} succeeded`);

  return results;
};