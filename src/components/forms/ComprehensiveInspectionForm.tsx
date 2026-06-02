// src/components/forms/ComprehensiveInspectionForm.tsx - FINAL: Both photo types
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Camera, SkipForward, AlertTriangle, XCircle, Droplet } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
 InspectionComponent,
 ComponentRating,
 RatingChoice,
 INSPECTION_COMPONENTS,
 calculateWeightedScore,
 getScoreStatus,
 PhotoWithMetadata,
} from '../../types/inspection.types';
import { RatingSelector } from './RatingSelector';
import { EnhancedPhotoUpload } from './EnhancedPhotoUpload'; // Per-component photos
import { GeneralPhotoUpload } from './GeneralPhotoUpload'; // General photos
import { InspectionSuccessModal } from './InspectionSuccessModal'; // Success modal
import { InspectionFailedModal } from './InspectionFailedModal'; // Failed modal
import { useAuth } from '../../hooks/useAuth';
import { useInspection } from '../../hooks/useInspection';
import { batchUploadToCloudinary } from '../../lib/cloudinary';

interface ComprehensiveInspectionFormProps {
 locationId: string;
}

export const ComprehensiveInspectionForm = ({
 locationId,
}: ComprehensiveInspectionFormProps) => {
 // Use Indonesian mode for all users
 const genZMode = true;
 const navigate = useNavigate();
 const { user, profile } = useAuth();
 const { getLocation, submitInspection } = useInspection();

 // Refs for cleanup
 const isMountedRef = useRef(true);
 const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

 // Form state
 const [ratings, setRatings] = useState<Map<InspectionComponent, ComponentRating>>(new Map());
 const [photos, setPhotos] = useState<Map<InspectionComponent, PhotoWithMetadata[]>>(new Map()); // Per-component
 const [generalPhotos, setGeneralPhotos] = useState<PhotoWithMetadata[]>([]); // General (mandatory)
 const [generalNotes, setGeneralNotes] = useState('');
 const [issuesFound, setIssuesFound] = useState(false);
 const [issueDescription, setIssueDescription] = useState('');
 const [requiresMaintenance, setRequiresMaintenance] = useState(false);
 const [uploadProgress, setUploadProgress] = useState<{
 current: number;
 total: number;
 percentage: number;
} | null>(null);
 const [maintenancePriority, setMaintenancePriority] = useState<
 'low' | 'medium' | 'high' | 'urgent'
 >('low');

 // UI state
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [startTime] = useState(new Date());
 const [currentScore, setCurrentScore] = useState(0);
 const [showSuccessModal, setShowSuccessModal] = useState(false);
 const [showFailedModal, setShowFailedModal] = useState(false);
 const [errorMessage, setErrorMessage] = useState('');
 const [expandedComponent, setExpandedComponent] = useState<InspectionComponent | null>(
 INSPECTION_COMPONENTS[0].id
 );

 const { data: location, isLoading: locationLoading } = getLocation(locationId);

 // Debug: Log when showSuccessModal changes
 useEffect(() => {
 console.log('🔄 showSuccessModal changed:', showSuccessModal);
 }, [showSuccessModal]);

 // Debug: Log when isSubmitting changes
 useEffect(() => {
 console.log('🔄 isSubmitting changed:', isSubmitting);
 }, [isSubmitting]);

 // Cleanup on unmount
 useEffect(() => {
 return () => {
 isMountedRef.current = false;
 if (navigationTimeoutRef.current) {
 clearTimeout(navigationTimeoutRef.current);
 }
 };
 }, []);

 // Calculate score whenever ratings change
 useEffect(() => {
 const ratingsList = Array.from(ratings.values());
 if (ratingsList.length > 0) {
 const score = calculateWeightedScore(ratingsList);
 setCurrentScore(score);
 }
 }, [ratings]);

 const handleRatingChange = (componentId: InspectionComponent, choice: RatingChoice) => {
 const existing = ratings.get(componentId) || {
 component: componentId,
 isAvailable: true, // Default to available
 choice: 'good',
 };
 setRatings(new Map(ratings.set(componentId, { ...existing, choice })));

 // Auto-expand next component
 const currentIndex = INSPECTION_COMPONENTS.findIndex((c) => c.id === componentId);
 if (currentIndex < INSPECTION_COMPONENTS.length - 1) {
 const nextComponent = INSPECTION_COMPONENTS[currentIndex + 1];
 if (!ratings.has(nextComponent.id)) {
 setExpandedComponent(nextComponent.id);
 }
 } else {
 // All done, close all
 setExpandedComponent(null);
 }
 };

 const handleAvailabilityChange = (componentId: InspectionComponent, isAvailable: boolean) => {
 const existing = ratings.get(componentId) || {
 component: componentId,
 isAvailable: true,
 choice: 'good',
 };
 setRatings(new Map(ratings.set(componentId, { ...existing, isAvailable })));

 // If setting to unavailable, auto-expand next component
 if (!isAvailable) {
 const currentIndex = INSPECTION_COMPONENTS.findIndex((c) => c.id === componentId);
 if (currentIndex < INSPECTION_COMPONENTS.length - 1) {
 const nextComponent = INSPECTION_COMPONENTS[currentIndex + 1];
 setExpandedComponent(nextComponent.id);
 }
 }
 };

 const handleNotesChange = (componentId: InspectionComponent, notes: string) => {
 const existing = ratings.get(componentId);
 if (existing) {
 setRatings(new Map(ratings.set(componentId, { ...existing, notes })));
 }
 };

 const handlePhotosChange = (
 componentId: InspectionComponent,
 newPhotos: PhotoWithMetadata[]
 ) => {
 setPhotos(new Map(photos.set(componentId, newPhotos)));
 };

 const validateForm = (): boolean => {
 const requiredComponents = INSPECTION_COMPONENTS.filter((c) => c.required);

 // Only validate required components that are marked as available
 const missingRatings = requiredComponents.filter((c) => {
 const rating = ratings.get(c.id);
 // Missing if: no rating OR (available but no choice)
 return !rating || (rating.isAvailable && !rating.choice);
 });

 if (missingRatings.length > 0) {
 const missing = missingRatings.map((c) => c.label).join(', ');
 toast.error(`Masih ada yang belum diisi: ${missing}`);
 setExpandedComponent(missingRatings[0].id);
 return false;
 }

 // Validate "other" choice must have notes (only for available components)
 const otherWithoutNotes = Array.from(ratings.values()).filter(
 (r) => r.isAvailable && r.choice === 'other' && !r.notes?.trim()
 );

 if (otherWithoutNotes.length > 0) {
 const component = INSPECTION_COMPONENTS.find(
 (c) => c.id === otherWithoutNotes[0].component
 );
 toast.error(`"${component?.labelGenZ}" pilih "Lainnya" tapi belum dikasih penjelasan!`);
 setExpandedComponent(otherWithoutNotes[0].component);
 return false;
 }

 // VALIDATE: General photos REQUIRED (min 1)
 if (generalPhotos.length === 0) {
 toast.error('Wajib upload minimal 1 foto dokumentasi!');
 return false;
 }

 if (issuesFound && !issueDescription.trim()) {
 toast.error('Tolong jelasin masalah yang ditemukan!');
 return false;
 }

 if (requiresMaintenance && !maintenancePriority) {
 toast.error('Pilih prioritas maintenance dong!');
 return false;
 }

 return true;
 };
// src/components/forms/ComprehensiveInspectionForm.tsx
// HANYA UPDATE BAGIAN handleSubmit

// ===============================================
// REPLACE handleSubmit FUNCTION:
// ===============================================
const handleSubmit = async () => {
 console.log('🚀 [SUBMIT] Starting submission...');

 if (!user) {
 console.error('❌ [SUBMIT] No user logged in');
 toast.error('Silakan login dulu');
 return;
 }
 console.log('✅ [SUBMIT] User check passed:', user.id);

 console.log('🔍 [SUBMIT] Running validation...');
 if (!validateForm()) {
 console.error('❌ [SUBMIT] Validation failed!');
 return;
 }
 console.log('✅ [SUBMIT] Validation passed');

 console.log('⏳ [SUBMIT] Setting isSubmitting = true');
 setIsSubmitting(true);

 try {
 const endTime = new Date();
 const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
 console.log('⏱️ [SUBMIT] Duration:', durationSeconds, 'seconds');

 // Collect all photos from per-component uploads
 const componentPhotos: File[] = [];
 for (const [componentId, componentPhotoList] of photos.entries()) {
 for (const photo of componentPhotoList) {
 componentPhotos.push(photo.file);
 }
 }
 console.log('📷 [SUBMIT] Component photos collected:', componentPhotos.length);

 // Collect general photos (mandatory)
 const allGeneralPhotos = generalPhotos.map(p => p.file);
 console.log('📷 [SUBMIT] General photos collected:', allGeneralPhotos.length);

 // Combine all photos
 const allPhotos = [...componentPhotos, ...allGeneralPhotos];
 const totalPhotos = allPhotos.length;
 console.log('📸 [SUBMIT] Total photos to process:', totalPhotos);

 if (totalPhotos === 0) {
 console.error('❌ [SUBMIT] No photos found!');
 toast.error('Wajib upload minimal 1 foto!');
 setIsSubmitting(false);
 return;
 }

 console.log('📸 [SUBMIT] Total photos to upload:', totalPhotos);

 // 🔥 NO COMPRESSION - Direct upload to Cloudinary
 // Cloudinary will optimize on their servers (faster & saves battery)
 console.log('☁️ [SUBMIT] Starting direct upload to Cloudinary (server will optimize)...');

 const toastId = toast.loading(`☁️ Upload ${totalPhotos} foto...`);

 setUploadProgress({
 current: 0,
 total: totalPhotos,
 percentage: 0
 });

 const uploadedUrls = await batchUploadToCloudinary(
 allPhotos, // Upload original photos directly (no compression)
 (current: number, total: number) => {
 // Only update state if component is still mounted
 if (isMountedRef.current) {
 const uploadPercent = Math.round((current / total) * 100); // 0-100%
 setUploadProgress({
 current: current,
 total: total,
 percentage: uploadPercent
 });

 toast.loading(`☁️ Upload ${current}/${total} foto...`, { id: toastId });
 }
 }
 );

 console.log(`✅ [SUBMIT] Uploaded ${uploadedUrls.length} photos to Cloudinary`);

 // ⚠️ VALIDATION: Check if photo upload failed
 if (totalPhotos > 0 && uploadedUrls.length === 0) {
 console.error('❌ [SUBMIT] All photo uploads failed!');
 throw new Error('Gagal upload foto! Coba lagi atau cek koneksi internet.');
 }

 if (uploadedUrls.length < totalPhotos) {
 console.warn(`⚠️ [SUBMIT] Only ${uploadedUrls.length}/${totalPhotos} photos uploaded successfully`);
 }

 // Update toast - saving
 console.log('💾 [SUBMIT] Preparing to save to database...');
 toast.loading('💾 Nyimpen inspection...', { id: toastId });

 setUploadProgress(null); // Clear upload progress

 // Map uploaded URLs back to components
 const updatedRatings = new Map(ratings);
 let photoIndex = 0;

 for (const [componentId, componentPhotoList] of photos.entries()) {
 const rating = updatedRatings.get(componentId);
 if (rating && componentPhotoList.length > 0) {
 // Get the first photo URL for this component
 rating.photo = uploadedUrls[photoIndex];
 updatedRatings.set(componentId, rating);
 photoIndex += componentPhotoList.length;
 }
 }

 // Prepare responses
 const responses: Record<string, any> = {
 ratings: Array.from(updatedRatings.values()),
 score: currentScore,
 issues_found: issuesFound,
 issue_description: issuesFound ? issueDescription.trim() : null,
 requires_maintenance: requiresMaintenance,
 maintenance_priority: requiresMaintenance ? maintenancePriority : null,
 inspection_mode: genZMode ? 'genz' : 'professional',
 submitted_at: new Date().toISOString(),
 inspector: {
 id: user.id,
 name: profile?.full_name || user.email?.split('@')[0] || 'Unknown',
 email: user.email,
 profile_id: profile?.id,
 },
 };

 // ✅ Submit to database with photo URLs (not files!)
 console.log('📤 Submitting inspection to database...');
 await submitInspection.mutateAsync({
 location_id: locationId,
 user_id: user.id,
 responses,
 photo_urls: uploadedUrls, // ✅ Pass URLs, not files
 notes: generalNotes.trim() || undefined,
 duration_seconds: durationSeconds,
 });

 console.log('✅ Inspection submitted successfully!');

 // Success - show modal with options
 toast.success(
 `🎉 Sukses! Score: ${currentScore}`,
 { id: toastId, duration: 2000 }
 );

 // Show success modal with navigation options
 console.log('🎉 Setting showSuccessModal = true');
 setShowSuccessModal(true);

 } catch (error: any) {
 console.error('❌ Submission error:', error);
 setUploadProgress(null); // Clear progress on error

 // Show detailed error modal instead of simple toast
 setErrorMessage(error.message || 'Gagal submit inspection');
 setShowFailedModal(true);

 // Keep toast for quick notification
 toast.error('😢 Gagal submit!', { duration: 2000 });
 } finally {
 setIsSubmitting(false);
 setUploadProgress(null); // Clear progress
 }
};

 // Retry handler for failed modal
 const handleRetry = () => {
 setShowFailedModal(false);
 setErrorMessage('');
 // Trigger submit again
 handleSubmit();
 };

 if (locationLoading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 </div>
 );
 }

 if (!location) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
 <div className="text-center">
 <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
 <p className="text-white/70">Lokasi tidak ditemukan</p>
 </div>
 </div>
 );
 }

 const scoreStatus = getScoreStatus(currentScore);
 const completedCount = ratings.size;
 const totalRequired = INSPECTION_COMPONENTS.filter((c) => c.required).length;
 const progress = (completedCount / INSPECTION_COMPONENTS.length) * 100;

 return (
 <div
 className={`min-h-screen pb-32 ${
 genZMode
 ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
 : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
 }`}
 >
 {/* Header */}
 <div
 className={`
 sticky top-0 z-20
 ${
 genZMode
 ? 'bg-white/8 border-b border-white/10 backdrop-blur-xl'
 : 'bg-white/8 border-b border-white/10 backdrop-blur-xl'
 }
 shadow-sm
 `}
 >
 <div className="p-4">
 <div className="flex items-center justify-between mb-3">
 <button
 onClick={() => navigate(-1)}
 className={`p-2 rounded-xl ${
 genZMode ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'
 }`}
 >
 <ArrowLeft className="w-5 h-5" />
 </button>

 </div>

 <div className="flex items-center space-x-3 mb-3">
 <div
 className={`
 w-12 h-12 rounded-xl flex items-center justify-center
 ${genZMode ? 'bg-white/20' : 'bg-blue-500/20'}
 `}
 >
 <Droplet className="w-6 h-6 text-white" />
 </div>
 <div className={genZMode ? 'text-white' : 'text-white'}>
 <h1 className="font-bold text-lg">{location.name}</h1>
 <p className={`text-sm ${genZMode ? 'text-white/80' : 'text-white/60'}`}>
 {[location.building, location.floor, location.area].filter(Boolean).join(' • ') || 'Detail lokasi'}
 </p>
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex items-center justify-between text-sm">
 <span className={genZMode ? 'text-white/90' : 'text-white/60'}>
 Progress {completedCount}/{INSPECTION_COMPONENTS.length}
 </span>
 {currentScore > 0 && (
 <span className={`font-bold ${genZMode ? 'text-white' : 'text-blue-600'}`}>
 Score: {currentScore}
 </span>
 )}
 </div>
 <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
 <div
 className={`h-full transition-all duration-300 ${
 genZMode ? 'bg-white' : 'bg-blue-500'
 }`}
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>
 </div>
 </div>

 {/* Form Content */}
 <div className="p-4 space-y-4">
 {/* Checklist Components */}
 {INSPECTION_COMPONENTS.map((component) => {
 const rating = ratings.get(component.id);
 const componentPhotos = photos.get(component.id) || [];
 const isExpanded = expandedComponent === component.id;

 return (
 <div key={component.id}>
 {isExpanded ? (
 <RatingSelector
 config={component}
 isAvailable={rating?.isAvailable ?? true}
 onAvailabilityChange={(available) => handleAvailabilityChange(component.id, available)}
 value={rating?.choice || null}
 onChange={(choice) => handleRatingChange(component.id, choice)}
 onPhotoAdd={
 component.allowPhoto
 ? () => {
 /* Photo handled below */
 }
 : undefined
 }
 hasPhoto={componentPhotos.length > 0}
 genZMode={genZMode}
 notes={rating?.notes}
 onNotesChange={(notes) => handleNotesChange(component.id, notes)}
 />
 ) : (
 <button
 type="button"
 onClick={() => setExpandedComponent(component.id)}
 className={`
 w-full p-4 rounded-2xl flex items-center justify-between
 transition-all border-2
 ${
 rating?.isAvailable === false
 ? 'bg-white/5 border-white/15'
 : rating
 ? genZMode
 ? 'bg-green-500/10 border-green-500'
 : 'bg-green-500/10 border-green-500'
 : genZMode
 ? 'bg-white/10 border-blue-500/30 hover:border-blue-500/50'
 : 'bg-white/8 border-white/15 hover:border-white/30'
 }
 `}
 >
 <div className="flex items-center space-x-3">
 {(() => {
 const IconComponent = component.icon ? (Icons as any)[component.icon] : null;
 return IconComponent ? (
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${genZMode ? 'bg-white/20' : 'bg-blue-500/20'}`}>
 <IconComponent className={`w-5 h-5 ${genZMode ? 'text-white' : 'text-blue-400'}`} />
 </div>
 ) : null;
 })()}
 <div className="flex flex-col items-start">
 <span className="font-medium text-white">
 {component.labelGenZ}
 </span>
 {rating?.isAvailable === false && (
 <span className="text-xs text-white/50">Tidak Ada</span>
 )}
 </div>
 </div>
 {rating?.isAvailable === false ? (
 <span className="text-sm text-white/50 flex items-center gap-1"><SkipForward className="w-4 h-4" /> Skip</span>
 ) : rating ? (
 <CheckCircle2 className="w-5 h-5 text-green-600" />
 ) : component.required ? (
 <span className="text-red-500">*</span>
 ) : null}
 </button>
 )}

 {/* Per-Component Photo Upload (optional) */}
 {isExpanded && component.allowPhoto && (
 <div className="mt-3">
 <EnhancedPhotoUpload
 componentId={component.id}
 photos={componentPhotos}
 onPhotosChange={(photos) => handlePhotosChange(component.id, photos)}
 genZMode={genZMode}
 />
 </div>
 )}

 {isExpanded && (
 <button
 type="button"
 onClick={() => setExpandedComponent(null)}
 className={`
 w-full mt-2 py-2 rounded-xl text-sm font-medium
 ${
 genZMode
 ? 'bg-blue-500/20 text-blue-700 hover:bg-blue-200'
 : 'bg-white/10 text-white/70 hover:bg-white/20'
 }
 `}
 >
 ↑ Minimize
 </button>
 )}
 </div>
 );
 })}

 {/* === GENERAL PHOTO SECTION (MANDATORY) === */}
 {completedCount >= totalRequired && (
 <div
 className={`${
 genZMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
 } rounded-2xl p-4 shadow-sm border-2 ${
 genZMode ? 'border-blue-400' : 'border-blue-400'
 }`}
 >
 <div className="flex items-center space-x-2 mb-2">
 <Camera className={`w-5 h-5 ${genZMode ? 'text-blue-700' : 'text-blue-700'}`} />
 <h3 className="font-bold text-white">
 Foto Dokumentasi
 <span className="text-red-500 ml-1">*</span>
 </h3>
 </div>

 <p className={`text-sm mb-4 ${genZMode ? 'text-blue-900' : 'text-blue-900'}`}>
 <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500" /> WAJIB minimal 1 foto! Auto watermark: Tanggal, Jam, GPS, Nama Toilet.</div>
 </p>

 <GeneralPhotoUpload
 photos={generalPhotos}
 onPhotosChange={setGeneralPhotos}
 maxPhotos={5}
 genZMode={genZMode}
 locationName={[location.name, location.building, location.floor].filter(Boolean).join(' - ')}
 />
 </div>
 )}

 {/* Issues Section */}
 <div
 className={`${
 genZMode ? 'bg-white/10' : 'bg-white/10'
 } rounded-2xl p-4 shadow-sm border border-white/10`}
 >
 <label className="flex items-center justify-between">
 <span className="font-semibold text-white flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-yellow-500" />
 Ada masalah yang ditemukan?
 </span>
 <input
 type="checkbox"
 checked={issuesFound}
 onChange={(e) => setIssuesFound(e.target.checked)}
 className="w-5 h-5 accent-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 cursor-pointer"
 />
 </label>

 {issuesFound && (
 <textarea
 value={issueDescription}
 onChange={(e) => setIssueDescription(e.target.value)}
 placeholder="Jelasin masalahnya..."
 className="w-full px-3 py-2 text-white bg-slate-800/80 border border-white/15 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-white/40"
 rows={3}
 />
 )}
 </div>

 {/* Maintenance Required */}
 <div
 className={`${
 genZMode ? 'bg-white/10' : 'bg-white/10'
 } rounded-2xl p-4 shadow-sm border border-white/10`}
 >
 <label className="flex items-center justify-between">
 <span className="font-semibold text-white">
 Perlu maintenance?
 </span>
 <input
 type="checkbox"
 checked={requiresMaintenance}
 onChange={(e) => setRequiresMaintenance(e.target.checked)}
 className="w-5 h-5 accent-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 cursor-pointer"
 />
 </label>

 {requiresMaintenance && (
 <div className="grid grid-cols-2 gap-2">
 {[
 { value: 'low', label: 'Rendah' },
 { value: 'medium', label: 'Sedang' },
 { value: 'high', label: 'Tinggi' },
 { value: 'urgent', label: 'Mendesak' }
 ].map(({ value, label }) => (
 <button
 key={value}
 type="button"
 onClick={() => setMaintenancePriority(value as any)}
 className={`
 py-2 px-3 rounded-xl text-sm font-medium
 ${
 maintenancePriority === value
 ? value === 'urgent'
 ? 'bg-red-100 text-red-700 border-2 border-red-500'
 : value === 'high'
 ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
 : value === 'medium'
 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
 : 'bg-blue-500/20 text-blue-700 border-2 border-blue-500'
 : 'bg-white/10 text-white/70 border-2 border-white/15'
 }
 `}
 >
 {label}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* General Notes */}
 <div
 className={`${
 genZMode ? 'bg-white/10' : 'bg-white/10'
 } rounded-2xl p-4 shadow-sm border border-white/10`}
 >
 <label className="block text-sm font-medium text-white/70 mb-2">
 Catatan tambahan (opsional)
 </label>
 <textarea
 value={generalNotes}
 onChange={(e) => setGeneralNotes(e.target.value)}
 placeholder="Ada yang mau ditambahin?"
 className="w-full px-3 py-2 text-white bg-slate-800/80 border border-white/15 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-white/40"
 rows={3}
 />
 </div>
 </div>




{/* Upload Progress Indicator */}
{uploadProgress && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full shadow-2xl">
 {/* Progress Title */}
 <div className="text-center mb-4">
 <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
 <svg 
 className="w-8 h-8 text-blue-600 animate-spin" 
 fill="none" 
 viewBox="0 0 24 24"
 >
 <circle 
 className="opacity-25" 
 cx="12" 
 cy="12" 
 r="10" 
 stroke="currentColor" 
 strokeWidth="4"
 />
 <path 
 className="opacity-75" 
 fill="currentColor" 
 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
 />
 </svg>
 </div>
 <h3 className="text-lg font-bold text-white mb-1">
 Upload Foto...
 </h3>
 <p className="text-sm text-white/60">
 {uploadProgress?.current || 0} dari {uploadProgress?.total || 0} foto
 </p>
 </div>

 {/* Progress Bar */}
 <div className="relative">
 <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
 style={{ width: `${uploadProgress?.percentage || 0}%` }}
 />
 </div>
 <div className="mt-2 text-center">
 <span className="text-2xl font-bold text-blue-600">
 {uploadProgress?.percentage || 0}%
 </span>
 </div>
 </div>

 {/* Info Text */}
 <p className="text-xs text-white/50 text-center mt-4">
 Sabar ya, lagi upload...
 </p>
 </div>
 </div>
)}

 {/* Submit Button (Sticky Bottom) */}
 <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-800/90 backdrop-blur-xl border-t border-white/10 shadow-lg">
 <button
 type="button"
 onClick={handleSubmit}
 disabled={isSubmitting || completedCount < totalRequired || generalPhotos.length === 0}
 className={`
 w-full py-4 rounded-xl font-bold text-white transition-all
 ${
 isSubmitting || completedCount < totalRequired || generalPhotos.length === 0
 ? 'bg-white/20 cursor-not-allowed'
 : genZMode
 ? 'bg-blue-600 hover:bg-blue-700'
 : 'bg-blue-600 hover:bg-blue-700'
 }
 `}
 >
 {isSubmitting
 ? (uploadProgress?.total || 0) > 0
 ? `Upload ${uploadProgress?.current || 0}/${uploadProgress?.total || 0}...`
 : 'Submitting...'
 : `Submit (Score: ${currentScore})`}
 </button>

 {(completedCount < totalRequired || generalPhotos.length === 0) && (
 <div className="text-center text-sm text-red-600 mt-2 space-y-1">
 {completedCount < totalRequired && (
 <p>
 <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Masih kurang {totalRequired - completedCount} komponen wajib</div>
 </p>
 )}
 {generalPhotos.length === 0 && (
 <p>
 Wajib upload minimal 1 foto dokumentasi
 </p>
 )}
 </div>
 )}
 </div>

 {/* Success Modal with Navigation Options */}
 <InspectionSuccessModal
 isOpen={showSuccessModal}
 score={currentScore}
 locationName={location?.name || 'Location'}
 />

 {/* Failed Modal for Network/Upload Errors */}
 <InspectionFailedModal
 isOpen={showFailedModal}
 onClose={() => setShowFailedModal(false)}
 onRetry={handleRetry}
 errorMessage={errorMessage}
 />
 </div>
 );
};