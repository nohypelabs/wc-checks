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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useUsers, useRoles, useAssignRole, useToggleUserStatus } from '../../hooks/useUserRoles';
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

  const getRoleBadgeColor = (level: number | undefined) => {
    if (!level) return 'bg-gray-100 text-gray-600';
    if (level >= 100) return 'bg-purple-100 text-purple-700 border-purple-300';
    if (level >= 80) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (level >= 50) return 'bg-green-100 text-green-700 border-green-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
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
    <div className="min-h-screen bg-gray-50 pb-24">
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
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-purple-100 text-sm">Level 90+ Required</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4">
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
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <p className="text-gray-600 text-sm">Loading users...</p>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
            >
              {/* User Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {user.full_name}
                    </h3>
                    {user.is_active ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  {user.phone && (
                    <p className="text-xs text-gray-500 mt-0.5">{user.phone}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
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
                <label className="text-xs font-medium text-gray-700">
                  Assign Role
                </label>
                <select
                  value={user.role?.id || ''}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-700">User Status</span>
                <button
                  onClick={() => handleToggleStatus(user.id, user.is_active ?? true)}
                  disabled={toggleStatusMutation.isPending}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    user.is_active
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No users found</p>
            <p className="text-gray-500 text-sm mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="px-4 mt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 text-sm mb-1">
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
      <BottomNav />
    </div>
  );
};