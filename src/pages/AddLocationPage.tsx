// src/pages/AddLocationPage.tsx - Add New Location (ADMIN ONLY)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Sidebar } from '../components/mobile/Sidebar';
import { BottomNav } from '../components/mobile/BottomNav';
import {
 MapPin,
 Menu,
 Building2,
 Layers,
 Hash,
 Save,
 ArrowLeft,
 Home as HomeIcon,
 Map,
 Grid,
 FileText,
 ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TablesInsert } from '../types/database.types';

type LocationInsert = TablesInsert<'locations'>;

interface Organization {
 id: string;
 name: string;
 short_code: string;
 is_active: boolean;
}

interface Building {
 id: string;
 name: string;
 short_code: string;
 organization_id: string;
 is_active: boolean;
}

export const AddLocationPage = () => {
 console.log('🟢 AddLocationPage: Component starting');

 const navigate = useNavigate();
 const { user, loading: authLoading } = useAuth(); // FIX: useAuth returns "loading"
 const { isAdmin, loading: adminLoading } = useIsAdmin();
 const queryClient = useQueryClient();

 console.log('🟢 AddLocationPage: Auth state', { hasUser: !!user, authLoading, isAdmin, adminLoading });
 const [sidebarOpen, setSidebarOpen] = useState(false);

 const [organizations, setOrganizations] = useState<Organization[]>([]);
 const [buildings, setBuildings] = useState<Building[]>([]);
 const [loadingBuildings, setLoadingBuildings] = useState(false);
 const [loadingOrganizations, setLoadingOrganizations] = useState(true);

 const [formData, setFormData] = useState({
 organization_id: '',
 building_id: '',
 name: '',
 code: '',
 floor: '',
 area: '',
 section: '',
 description: '',
 });

 // Fetch organizations on mount
 useEffect(() => {
 const fetchOrganizations = async () => {
 setLoadingOrganizations(true);
 try {
 const { data, error } = await supabase
 .from('organizations')
 .select('*')
 .eq('is_active', true)
 .order('name');

 if (error) throw error;

 setOrganizations(data || []);
 } catch (error: any) {
 console.error('Error fetching organizations:', error);
 toast.error('Gagal memuat daftar organisasi: ' + (error.message || 'Unknown error'));
 setOrganizations([]); // Set empty array on error
 } finally {
 setLoadingOrganizations(false);
 }
 };

 fetchOrganizations();
 }, []);

 // Fetch buildings when organization changes
 useEffect(() => {
 const fetchBuildings = async () => {
 if (!formData.organization_id) {
 setBuildings([]);
 return;
 }

 setLoadingBuildings(true);
 try {
 const { data, error } = await supabase
 .from('buildings')
 .select('*')
 .eq('organization_id', formData.organization_id)
 .eq('is_active', true)
 .order('name');

 if (error) throw error;

 setBuildings(data || []);
 } catch (error: any) {
 console.error('Error fetching buildings:', error);
 toast.error('Gagal memuat daftar gedung: ' + (error.message || 'Unknown error'));
 setBuildings([]); // Set empty array on error
 } finally {
 setLoadingBuildings(false);
 }
 };

 fetchBuildings();
 }, [formData.organization_id]);

 // Create location mutation
 const createLocationMutation = useMutation({
 mutationFn: async (data: typeof formData) => {
 console.log('🔵 Mutation starting', { data, userId: user?.id });

 if (!user?.id) throw new Error('User not authenticated');
 if (!data.organization_id || !data.building_id) {
 throw new Error('Organization and Building are required');
 }

 console.log('🔵 Fetching building info for QR code generation...');
 // Fetch building to generate QR code
 const { data: building, error: buildingError } = await supabase
 .from('buildings')
 .select('short_code, organizations(short_code)')
 .eq('id', data.building_id)
 .single();

 if (buildingError || !building) {
 console.error('❌ Building not found:', buildingError);
 throw new Error('Building not found');
 }

 console.log('✅ Building found:', building);

 // Generate QR code
 const orgCode = (building.organizations as any).short_code;
 const buildingCode = building.short_code;
 const locationCode = data.code || 'LOC';
 const uniqueId = Date.now().toString(36).slice(-4);

 const qrCode = `${orgCode}-${buildingCode}-${locationCode}-${uniqueId}`.toUpperCase();
 console.log('✅ Generated QR code:', qrCode);

 // Create location object
 const newLocation: LocationInsert = {
 name: data.name.trim(),
 code: data.code.trim() || null,
 organization_id: data.organization_id,
 building_id: data.building_id,
 floor: data.floor.trim() || null,
 area: data.area || null,
 section: data.section.trim() || null,
 description: data.description.trim() || null,
 qr_code: qrCode,
 is_active: true,
 created_by: user.id,
 };

 console.log('🔵 Inserting location into database...', newLocation);

 const { data: newLocationData, error } = await supabase
 .from('locations')
 .insert(newLocation)
 .select()
 .single();

 if (error) {
 console.error('❌ Database insert error:', error);
 throw error;
 }

 console.log('✅ Location created successfully:', newLocationData);
 return newLocationData;
 },
 onSuccess: () => {
 console.log('✅ Mutation success - redirecting to /locations');
 queryClient.invalidateQueries({ queryKey: ['locations-list'] });
 queryClient.invalidateQueries({ queryKey: ['locations'] });
 toast.success('Location added successfully!');
 navigate('/locations');
 },
 onError: (error: any) => {
 console.error('❌ Mutation error:', error);
 toast.error(error.message || 'Failed to add location');
 },
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 console.log('🔵 Form submitted', formData);

 // Validation
 if (!formData.organization_id) {
 toast.error('Please select an organization');
 return;
 }
 if (!formData.building_id) {
 toast.error('Please select a building');
 return;
 }
 if (!formData.name.trim()) {
 toast.error('Location name is required');
 return;
 }

 console.log('✅ Validation passed, creating location...');
 createLocationMutation.mutate(formData);
 };

 const handleChange = (field: string, value: string) => {
 setFormData((prev) => {
 // Reset building when organization changes
 if (field === 'organization_id') {
 return { ...prev, [field]: value, building_id: '' };
 }
 return { ...prev, [field]: value };
 });
 };

 console.log('🟢 AddLocationPage: Render checks', {
 authLoading,
 adminLoading,
 hasUser: !!user,
 isAdmin,
 willShowLoading: authLoading || adminLoading,
 willShowAccessDenied: !authLoading && !adminLoading && !isAdmin
 });

 if (authLoading || adminLoading) {
 console.log('🟡 Showing loading spinner');
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
 <p className="text-white/60 text-sm">Checking permissions...</p>
 </div>
 </div>
 );
 }

 if (!user) {
 console.log('🔴 No user - redirecting to login');
 navigate('/login', { replace: true });
 return null;
 }

 // Admin check - redirect to dashboard if not admin
 if (!isAdmin) {
 console.log('🔴 ACCESS DENIED - User is not admin', {
 userId: user.id,
 email: user.email,
 isAdmin
 });
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
 <div className="text-center max-w-md">
 <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-4" />
 <h2 className="text-2xl font-bold text-white mb-3">
 Admin Access Required
 </h2>
 <p className="text-white/60 mb-6 leading-relaxed">
 You need administrator privileges to add new locations.
 </p>
 <div className="mb-6 p-4 bg-white/10 rounded-lg text-left">
 <p className="text-xs text-white/60 mb-1">Debug Info:</p>
 <p className="text-xs text-white">User: {user.email}</p>
 <p className="text-xs text-white">Admin Status: {isAdmin ? 'Yes' : 'No'}</p>
 </div>
 <button
 onClick={() => navigate('/')}
 className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
 >
 Return to Dashboard
 </button>
 </div>
 </div>
 );
 }

 console.log('✅ Admin access granted - rendering form');

 // Show loading UI while fetching data
 if (loadingOrganizations || loadingBuildings) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
 <p className="text-white/60 text-sm">Memuat data formulir...</p>
 </div>
 </div>
 );
 }

 // Show empty state if no organizations available
 if (!loadingOrganizations && organizations.length === 0) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
 <div className="text-center max-w-md">
 <Building2 className="w-20 h-20 text-white/40 mx-auto mb-4" />
 <h2 className="text-2xl font-bold text-white mb-3">
 Tidak Ada Organisasi
 </h2>
 <p className="text-white/60 mb-6 leading-relaxed">
 Anda perlu membuat organisasi terlebih dahulu sebelum menambahkan lokasi.
 </p>
 <button
 onClick={() => navigate('/admin/organizations')}
 className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-md"
 >
 Buat Organisasi
 </button>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-6">
 {/* Sidebar */}
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

 {/* Header */}
 <div className="bg-white/8 backdrop-blur-xl px-3 py-2.5 shadow-xl border-b border-white/10 lg:py-3 lg:px-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <button
 onClick={() => navigate(-1)}
 className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
 >
 <ArrowLeft className="w-5 h-5 text-white/60" />
 </button>
 <div>
 <h1 className="text-xl font-bold text-white">Add Location</h1>
 <p className="text-sm text-white/50">Create new inspection point</p>
 </div>
 </div>
 <button
 onClick={() => setSidebarOpen(true)}
 className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
 >
 <Menu className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Form */}
 <div className="p-6">
 <form onSubmit={handleSubmit} className="space-y-5">
 {/* Organization Dropdown */}
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
 <HomeIcon className="w-4 h-4 text-blue-300" />
 Organization *
 </label>
 <select
 value={formData.organization_id}
 onChange={(e) => handleChange('organization_id', e.target.value)}
 className="w-full px-4 py-3 bg-white border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 required
 disabled={createLocationMutation.isPending}
 >
 <option value="">Select Organization</option>
 {organizations.map((org) => (
 <option key={org.id} value={org.id}>
 {org.name} ({org.short_code})
 </option>
 ))}
 </select>
 {organizations.length === 0 && (
 <p className="text-xs text-red-500 mt-1">
 No organizations found. Please contact admin.
 </p>
 )}
 </div>

 {/* Building Dropdown */}
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
 <Building2 className="w-4 h-4 text-blue-300" />
 Building *
 </label>
 <select
 value={formData.building_id}
 onChange={(e) => handleChange('building_id', e.target.value)}
 className="w-full px-4 py-3 bg-white border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
 required
 disabled={
 !formData.organization_id ||
 loadingBuildings ||
 createLocationMutation.isPending
 }
 >
 <option value="">
 {loadingBuildings
 ? 'Loading buildings...'
 : !formData.organization_id
 ? 'Select organization first'
 : 'Select Building'}
 </option>
 {buildings.map((building) => (
 <option key={building.id} value={building.id}>
 {building.name} ({building.short_code})
 </option>
 ))}
 </select>
 {formData.organization_id && buildings.length === 0 && !loadingBuildings && (
 <p className="text-xs text-orange-500 mt-1">
 No buildings found for this organization.
 </p>
 )}
 </div>

 {/* Location Name */}
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
 <MapPin className="w-4 h-4 text-blue-300" />
 Location Name *
 </label>
 <input
 type="text"
 value={formData.name}
 onChange={(e) => handleChange('name', e.target.value)}
 placeholder="e.g., Men's Toilet, Women's Restroom"
 className="w-full px-4 py-3 bg-white border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 required
 disabled={createLocationMutation.isPending}
 />
 </div>

 {/* Code (Optional) */}
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
 <Hash className="w-4 h-4 text-white/40" />
 Location Code (Optional)
 </label>
 <input
 type="text"
 value={formData.code}
 onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
 placeholder="e.g., WC-01, TL-A1"
 className="w-full px-4 py-3 bg-white border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 disabled={createLocationMutation.isPending}
 />
 <p className="text-xs text-white/50 mt-1">
 Will be used for QR code generation
 </p>
 </div>

 {/* Floor & Section - Two columns */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
 <Layers className="w-4 h-4 text-white/40" />
 Floor
 </label>
 <input
 type="text"
 value={formData.floor}
 onChange={(e) => handleChange('floor', e.target.value)}
 placeholder="e.g., 1F, Ground"
 className="w-full px-4 py-3 bg-white border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 disabled={createLocationMutation.isPending}
 />
 </div>

 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
 <Grid className="w-4 h-4 text-white/40" />
 Section
 </label>
 <input
 type="text"
 value={formData.section}
 onChange={(e) => handleChange('section', e.target.value)}
 placeholder="e.g., Men, Women"
 className="w-full px-4 py-3 bg-white border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 disabled={createLocationMutation.isPending}
 />
 </div>
 </div>

 {/* Area Type */}
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
 <Map className="w-4 h-4 text-white/40" />
 Area Type
 </label>
 <select
 value={formData.area}
 onChange={(e) => handleChange('area', e.target.value)}
 className="w-full px-4 py-3 bg-white border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 disabled={createLocationMutation.isPending}
 >
 <option value="">Select Area Type (Optional)</option>
 <option value="Public Area">Public Area</option>
 <option value="Staff Area">Staff Area</option>
 <option value="VIP Area">VIP Area</option>
 <option value="Service Area">Service Area</option>
 <option value="Emergency Area">Emergency Area</option>
 </select>
 </div>

 {/* Description */}
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
 <FileText className="w-4 h-4 text-white/40" />
 Description (Optional)
 </label>
 <textarea
 value={formData.description}
 onChange={(e) => handleChange('description', e.target.value)}
 placeholder="Additional notes or special instructions..."
 className="w-full px-4 py-3 bg-white border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
 rows={3}
 disabled={createLocationMutation.isPending}
 />
 </div>

 {/* Submit Button */}
 <div className="pt-4 space-y-3">
 <button
 type="submit"
 disabled={createLocationMutation.isPending}
 className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 >
 {createLocationMutation.isPending ? (
 <>
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
 <span>Saving...</span>
 </>
 ) : (
 <>
 <Save className="w-5 h-5" />
 <span>Save Location</span>
 </>
 )}
 </button>

 <button
 type="button"
 onClick={() => navigate(-1)}
 disabled={createLocationMutation.isPending}
 className="w-full bg-white border-2 border-white/15 text-white/70 py-4 rounded-2xl font-medium hover:bg-white/8 active:scale-[0.98] transition-all disabled:opacity-50"
 >
 Cancel
 </button>
 </div>
 </form>

 {/* Info Box */}
 <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
 <p className="text-sm text-blue-200 font-medium mb-2">💡 Tips:</p>
 <ul className="text-sm text-blue-800 space-y-1">
 <li>• Select organization first, then building</li>
 <li>• QR code will be auto-generated from codes</li>
 <li>• Use clear, descriptive location names</li>
 <li>• Location will be active by default</li>
 </ul>
 </div>
 </div>

 {/* Bottom Navigation */}
 <div className="lg:hidden"><BottomNav /></div>
 </div>
 );
};
