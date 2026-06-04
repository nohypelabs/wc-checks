// src/pages/superadmin/UserManagement.tsx - SUPERADMIN ONLY User & Role Management
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
 Users,
 Shield,
 Search,
 AlertCircle,
 CheckCircle2,
 XCircle,
 ArrowLeft,
 Power,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useUsers, useRoles, useAssignRole, useToggleUserStatus, useBlockAllSubmit, useUnblockAllSubmit } from '../../hooks/useUserRoles';
import { Sidebar } from '../../components/mobile/Sidebar';
import { BottomNav } from '../../components/mobile/BottomNav';
import { format } from 'date-fns';

export const UserManagement = () => {
 console.log('🔵 [UserManagement] COMPONENT RENDER START');

 const navigate = useNavigate();
 const { user, loading: authLoading } = useAuth();

 console.log('🔵 [UserManagement] Auth state:', {
 hasUser: !!user,
 userId: user?.id,
 authLoading,
 });

 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [roleFilter, setRoleFilter] = useState<string>('all');

 // ✅ FIXED: Use backend API for role check instead of direct query
 const { isSuperAdmin, loading: roleLoading, isAdmin } = useIsAdmin();

 console.log('🔵 [UserManagement] useIsAdmin result:', {
 isSuperAdmin,
 isAdmin,
 roleLoading,
 });

 const { data: users, isLoading: usersLoading } = useUsers();
 const { data: roles } = useRoles();
 const assignRoleMutation = useAssignRole();
 const toggleStatusMutation = useToggleUserStatus();
 const blockAllMutation = useBlockAllSubmit();
 const unblockAllMutation = useUnblockAllSubmit();
 const [showKillSwitchConfirm, setShowKillSwitchConfirm] = useState(false);
 const [killSwitchAction, setKillSwitchAction] = useState<'block' | 'unblock'>('block');

 // Security check: Only superadmin can access
 useEffect(() => {
 console.log('🟢 [UserManagement] useEffect TRIGGERED', {
 authLoading,
 roleLoading,
 hasUser: !!user,
 userId: user?.id,
 isSuperAdmin,
 });

 // ✅ FIX: Wait for BOTH auth and role to complete loading
 // Don't redirect until we have definitive results
 if (authLoading || roleLoading) {
 console.log('[UserManagement] Still loading auth or role...');
 return;
 }

 // ✅ FIX: Only redirect if we're sure there's no user
 if (!user?.id) {
 console.log('🔴 [UserManagement] No user ID - redirecting to login');
 navigate('/login');
 return;
 }

 // ✅ FIX: Only redirect if we have a definitive answer AND it's false
 // This prevents premature redirects before role check completes
 if (!isSuperAdmin) {
 console.log('🔴 [UserManagement] Not superadmin - ACCESS DENIED - redirecting to home', {
 isSuperAdmin,
 userId: user.id,
 });
 navigate('/');
 return;
 }

 console.log('✅ [UserManagement] Superadmin verified - ACCESS GRANTED');
 }, [user, isSuperAdmin, authLoading, roleLoading, navigate]);

 // Filter users
 const filteredUsers = users?.filter((u) => {
 const matchesSearch =
 u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 u.email.toLowerCase().includes(searchQuery.toLowerCase());

 const matchesRole =
 roleFilter === 'all' ||
 (roleFilter === 'none' && !u.role) ||
 u.role?.id === roleFilter;

 return matchesSearch && matchesRole;
 });

 const handleRoleChange = (userId: string, roleId: string) => {
 if (!user?.id) return;
 assignRoleMutation.mutate({
 userId,
 roleId,
 // assignedBy is now handled automatically by the backend
 });
 };

 const handleToggleStatus = (userId: string, currentStatus: boolean) => {
 toggleStatusMutation.mutate({
 userId,
 isActive: !currentStatus,
 });
 };

 const handleKillSwitch = () => {
   if (killSwitchAction === 'block') {
     blockAllMutation.mutate();
   } else {
     unblockAllMutation.mutate();
   }
   setShowKillSwitchConfirm(false);
 };

 const openKillSwitchConfirm = (action: 'block' | 'unblock') => {
   setKillSwitchAction(action);
   setShowKillSwitchConfirm(true);
 };

 const getRoleBadgeColor = (level: number | undefined) => {
 if (!level) return 'bg-white/10 text-white/60';
 if (level >= 100) return 'bg-purple-100 text-purple-300 border-purple-300';
 if (level >= 80) return 'bg-blue-100 text-blue-300 border-blue-400/40';
 if (level >= 50) return 'bg-green-100 text-green-300 border-green-300';
 return 'bg-white/10 text-white/60 border-white/20';
 };

 console.log('🔵 [UserManagement] Render state:', {
 authLoading,
 roleLoading,
 isSuperAdmin,
 hasUser: !!user,
 });

 // Wait for auth to finish loading, user to be loaded, OR role check
 if (authLoading || !user || roleLoading) {
 console.log('⏳ [UserManagement] Showing loading screen - waiting for auth/user/role check');
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
 <p className="text-white/60">
 {authLoading ? 'Loading authentication...' : !user ? 'Loading user...' : 'Verifying superadmin access...'}
 </p>
 </div>
 </div>
 );
 }

 if (!isSuperAdmin) {
 console.log('🔴 [UserManagement] Not superadmin - will redirect (returning null)');
 return null; // Will redirect
 }

 console.log('✅ [UserManagement] Rendering main content');

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-6">
 <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
 {/* Header */}
 <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6">
 <button
 onClick={() => navigate('/')}
 className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
 >
 <ArrowLeft className="w-5 h-5" />
 <span>Back to Dashboard</span>
 </button>

 <div className="flex items-center gap-3 mb-2">
 <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
 <Shield className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-2xl font-bold">User Management</h1>
 <p className="text-purple-100 text-sm">Level 90+ Required</p>
 </div>
 </div>

 <div className="bg-white/8 backdrop-blur-sm rounded-xl p-4 mt-4">
 <div className="grid grid-cols-3 gap-4 text-center">
 <div>
 <div className="text-2xl font-bold">{users?.length || 0}</div>
 <div className="text-xs text-purple-100">Total Users</div>
 </div>
 <div>
 <div className="text-2xl font-bold">
 {users?.filter((u) => u.is_active).length || 0}
 </div>
 <div className="text-xs text-purple-100">Active</div>
 </div>
 <div>
 <div className="text-2xl font-bold">
 {users?.filter((u) => u.role && u.role.level >= 80).length || 0}
 </div>
 <div className="text-xs text-purple-100">Admins</div>
 </div>
 </div>

 {/* Kill Switch */}
 <div className="bg-white/8 backdrop-blur-sm rounded-xl p-4 mt-4">
   <div className="flex items-center justify-between">
     <div className="flex items-center gap-3">
       <Power className="w-5 h-5 text-red-400" />
       <div>
         <h3 className="text-sm font-semibold text-white">Kill Switch</h3>
         <p className="text-xs text-white/60">Block semua user kecuali superadmin</p>
       </div>
     </div>
     <div className="flex gap-2">
       <button
         onClick={() => openKillSwitchConfirm('block')}
         disabled={blockAllMutation.isPending}
         className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
       >
         {blockAllMutation.isPending ? 'Blocking...' : 'Block All'}
       </button>
       <button
         onClick={() => openKillSwitchConfirm('unblock')}
         disabled={unblockAllMutation.isPending}
         className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
       >
         {unblockAllMutation.isPending ? 'Unblocking...' : 'Unblock All'}
       </button>
     </div>
   </div>
 </div>
 </div>

 {/* Kill Switch Confirmation Modal */}
 {showKillSwitchConfirm && (
   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
     <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/10">
       <div className="text-center">
         <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${killSwitchAction === 'block' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
           <Power className={`w-8 h-8 ${killSwitchAction === 'block' ? 'text-red-400' : 'text-green-400'}`} />
         </div>
         <h3 className="text-lg font-bold text-white mb-2">
           {killSwitchAction === 'block' ? 'Aktifkan Kill Switch?' : 'Nonaktifkan Kill Switch?'}
         </h3>
         <p className="text-white/60 text-sm mb-6">
           {killSwitchAction === 'block'
             ? 'Semua user kecuali superadmin akan diblokir dari submit inspection.'
             : 'Semua user akan bisa submit inspection lagi.'}
         </p>
         <div className="flex gap-3">
           <button
             onClick={() => setShowKillSwitchConfirm(false)}
             className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
           >
             Batal
           </button>
           <button
             onClick={handleKillSwitch}
             className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors ${
               killSwitchAction === 'block'
                 ? 'bg-red-600 hover:bg-red-700'
                 : 'bg-green-600 hover:bg-green-700'
             }`}
           >
             {killSwitchAction === 'block' ? 'Block Semua' : 'Unblock Semua'}
           </button>
         </div>
       </div>
     </div>
   </div>
 )}

 {/* Filters */}
 <div className="p-4 space-y-3">
 {/* Search */}
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
 <input
 type="text"
 placeholder="Search by name or email..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-3 border border-white/15 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
 />
 </div>

 {/* Role Filter */}
 <select
 value={roleFilter}
 onChange={(e) => setRoleFilter(e.target.value)}
 className="w-full px-4 py-3 border border-white/15 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
 >
 <option value="all">All Roles</option>
 <option value="none">No Role Assigned</option>
 {roles?.map((role) => (
 <option key={role.id} value={role.id}>
 {role.name} (Level {role.level})
 </option>
 ))}
 </select>
 </div>

 {/* User List */}
 <div className="px-4 space-y-3">
 {usersLoading ? (
 <div className="text-center py-8">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
 <p className="text-white/60 text-sm">Loading users...</p>
 </div>
 ) : filteredUsers && filteredUsers.length > 0 ? (
 filteredUsers.map((user) => (
 <div
 key={user.id}
 className="bg-white/8 rounded-2xl shadow-sm border border-white/10 backdrop-blur-sm p-4"
 >
 {/* User Info */}
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="font-semibold text-white truncate">
 {user.full_name}
 </h3>
 {user.is_active ? (
 <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
 ) : (
 <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
 )}
 </div>
 <p className="text-sm text-white/60 truncate">{user.email}</p>
 {user.phone && (
 <p className="text-xs text-white/50 mt-0.5">{user.phone}</p>
 )}
 <p className="text-xs text-white/40 mt-1">
 Joined {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
 </p>
 </div>

 {/* Current Role Badge */}
 {user.role && (
 <span
 className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
 user.role.level
 )}`}
 >
 {user.role.name}
 </span>
 )}
 </div>

 {/* Role Selector */}
 <div className="space-y-2">
 <label className="text-xs font-medium text-white/80">
 Assign Role
 </label>
 <select
 value={user.role?.id || ''}
 onChange={(e) => handleRoleChange(user.id, e.target.value)}
 className="w-full px-3 py-2 border border-white/15 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
 disabled={assignRoleMutation.isPending}
 >
 <option value="">No Role</option>
 {roles?.map((role) => (
 <option key={role.id} value={role.id}>
 {role.name} (Level {role.level})
 </option>
 ))}
 </select>
 </div>

 {/* Status Toggle */}
 <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
 <span className="text-sm text-white/80">User Status</span>
 <button
 onClick={() => handleToggleStatus(user.id, user.is_active ?? true)}
 disabled={toggleStatusMutation.isPending}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 user.is_active
 ? 'bg-red-50 text-red-700 hover:bg-red-100'
 : 'bg-green-50 text-green-300 hover:bg-green-100'
 }`}
 >
 {user.is_active ? 'Deactivate' : 'Activate'}
 </button>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-12">
 <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
 <p className="text-white/60 font-medium">No users found</p>
 <p className="text-white/50 text-sm mt-1">
 Try adjusting your search or filters
 </p>
 </div>
 )}
 </div>

 {/* Info Banner */}
 <div className="px-4 mt-6">
 <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <h4 className="font-semibold text-blue-200 text-sm mb-1">
 Role Level Guide
 </h4>
 <ul className="text-xs text-blue-800 space-y-1">
 <li>• <strong>Level 100:</strong> System Admin - Full system control</li>
 <li>• <strong>Level 90:</strong> Super Admin - User management access</li>
 <li>• <strong>Level 80:</strong> Admin - Manage organization</li>
 <li>• <strong>Level 50:</strong> Manager - Supervisory access</li>
 <li>• <strong>Level 10:</strong> Inspector - Basic user</li>
 </ul>
 </div>
 </div>
 </div>

 {/* Bottom Navigation */}
 <div className="lg:hidden"><div className="lg:hidden"><BottomNav /></div></div>
 </div>
 );
};