// src/pages/superadmin/UserManagement.tsx - SUPERADMIN ONLY User & Role Management
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Power,
  ShieldCheck,
  ShieldX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useUsers, useRoles, useAssignRole, useToggleUserStatus, useBlockAllSubmit, useUnblockAllSubmit } from '../../hooks/useUserRoles';
import { Sidebar } from '../../components/mobile/Sidebar';
import { BottomNav } from '../../components/mobile/BottomNav';
import { format } from 'date-fns';

const USERS_PER_PAGE = 10;

export const UserManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showKillSwitchConfirm, setShowKillSwitchConfirm] = useState(false);
  const [killSwitchAction, setKillSwitchAction] = useState<'block' | 'unblock'>('block');
  const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const { isSuperAdmin, loading: roleLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: roles } = useRoles();
  const assignRoleMutation = useAssignRole();
  const toggleStatusMutation = useToggleUserStatus();
  const blockAllMutation = useBlockAllSubmit();
  const unblockAllMutation = useUnblockAllSubmit();

  // Derive kill switch state
  const killSwitchState = useMemo(() => {
    if (!users || users.length === 0) return { active: false, blockedCount: 0, totalNonSuperadmin: 0 };
    const nonSuperadmin = users.filter(u => !u.role || u.role.level < 100);
    const blocked = nonSuperadmin.filter(u => u.can_submit === false);
    return {
      active: blocked.length === nonSuperadmin.length && nonSuperadmin.length > 0,
      blockedCount: blocked.length,
      totalNonSuperadmin: nonSuperadmin.length,
    };
  }, [users]);

  // Security check
  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user?.id) { navigate('/login'); return; }
    if (!isSuperAdmin) { navigate('/'); return; }
  }, [user, isSuperAdmin, authLoading, roleLoading, navigate]);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'none' && !u.role) ||
        u.role?.id === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active) ||
        (statusFilter === 'blocked' && u.can_submit === false) ||
        (statusFilter === 'can_submit' && u.can_submit !== false);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, roleFilter, statusFilter]);

  const handleRoleChange = (userId: string, roleId: string) => {
    if (!user?.id) return;
    assignRoleMutation.mutate({ userId, roleId });
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const handleKillSwitch = () => {
    const mutation = killSwitchAction === 'block' ? blockAllMutation : unblockAllMutation;
    mutation.mutate(undefined, {
      onSuccess: (data) => {
        setResultModal({
          type: 'success',
          message: data?.message || (killSwitchAction === 'block' ? 'Semua user berhasil diblokir!' : 'Semua user berhasil di-unblock!'),
        });
      },
      onError: (error: any) => {
        setResultModal({ type: 'error', message: error?.message || 'Terjadi kesalahan. Coba lagi.' });
      },
    });
    setShowKillSwitchConfirm(false);
  };

  const getRoleBadgeColor = (level: number | undefined) => {
    if (!level) return 'bg-white/10 text-white/50 border-white/10';
    if (level >= 100) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (level >= 80) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (level >= 50) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    return 'bg-white/10 text-white/50 border-white/10';
  };

  // Loading
  if (authLoading || !user || roleLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-white/50 text-sm">
            {authLoading ? 'Loading auth...' : !user ? 'Loading user...' : 'Verifying access...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-900 pb-24 lg:pb-6">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="bg-slate-800 border-b border-white/10 px-4 py-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">User Management</h1>
              <p className="text-white/40 text-xs">{users?.length || 0} users</p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            killSwitchState.active
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {killSwitchState.active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {killSwitchState.active ? 'LOCKED' : 'OPEN'}
          </div>
        </div>
      </div>

      {/* Kill Switch Card */}
      <div className="px-4 mt-2 relative z-10">
        <div className={`rounded-xl p-4 border transition-colors ${
          killSwitchState.active ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800 border-white/10'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                killSwitchState.active ? 'bg-red-500/20' : 'bg-white/5'
              }`}>
                <Power className={`w-4 h-4 ${killSwitchState.active ? 'text-red-400' : 'text-white/40'}`} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">Kill Switch</h3>
                <p className="text-xs text-white/40 truncate">
                  {killSwitchState.active
                    ? `${killSwitchState.blockedCount} user diblokir`
                    : `${killSwitchState.totalNonSuperadmin} user aktif`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { setKillSwitchAction('block'); setShowKillSwitchConfirm(true); }}
                disabled={blockAllMutation.isPending || killSwitchState.active}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldX className="w-3.5 h-3.5" />
                {blockAllMutation.isPending ? 'Blocking...' : 'Block All'}
              </button>
              <button
                onClick={() => { setKillSwitchAction('unblock'); setShowKillSwitchConfirm(true); }}
                disabled={unblockAllMutation.isPending || !killSwitchState.active}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {unblockAllMutation.isPending ? 'Unblocking...' : 'Unblock All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mt-5 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
          >
            <option value="all">Semua Role</option>
            <option value="none">Tanpa Role</option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>{role.name} (Lv.{role.level})</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
            <option value="can_submit">Bisa Submit</option>
            <option value="blocked">Diblokir</option>
          </select>
        </div>
        {filteredUsers.length > 0 && (
          <p className="text-xs text-white/30 px-1">
            Menampilkan {Math.min((page - 1) * USERS_PER_PAGE + 1, filteredUsers.length)}–{Math.min(page * USERS_PER_PAGE, filteredUsers.length)} dari {filteredUsers.length} user
          </p>
        )}
      </div>

      {/* User List */}
      <div className="px-4 mt-4 space-y-2">
        {usersLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-white/40 text-sm">Loading users...</p>
          </div>
        ) : paginatedUsers.length > 0 ? (
          paginatedUsers.map((u) => {
            const isExpanded = expandedUser === u.id;
            return (
              <div key={u.id} className={`rounded-xl border transition-colors ${
                u.can_submit === false ? 'bg-red-500/5 border-red-500/15' : 'bg-slate-800 border-white/10'
              }`}>
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    u.role?.level && u.role.level >= 100 ? 'bg-purple-500/20 text-purple-300'
                    : u.role?.level && u.role.level >= 80 ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-white/10 text-white/50'
                  }`}>
                    {u.full_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{u.full_name}</span>
                      {u.can_submit === false && (
                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-medium rounded flex-shrink-0">BLOCKED</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 truncate">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.role && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getRoleBadgeColor(u.role.level)}`}>
                        {u.role.name}
                      </span>
                    )}
                    {u.is_active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Role</label>
                        <select
                          value={u.role?.id || ''}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-700 border border-white/10 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 disabled:opacity-50 appearance-none"
                          disabled={assignRoleMutation.isPending}
                        >
                          <option value="">No Role</option>
                          {roles?.map((role) => (
                            <option key={role.id} value={role.id}>{role.name} (Lv.{role.level})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Status</label>
                        <button
                          onClick={() => handleToggleStatus(u.id, u.is_active ?? true)}
                          disabled={toggleStatusMutation.isPending}
                          className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            u.is_active
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/25'
                              : 'bg-red-500/15 text-red-300 border border-red-500/20 hover:bg-red-500/25'
                          }`}
                        >
                          {u.is_active ? 'Aktif ✓' : 'Nonaktif ✗'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-white/30 pt-1">
                      <span>Joined {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy') : 'N/A'}</span>
                      {u.last_login_at && <span>Login {format(new Date(u.last_login_at), 'dd MMM HH:mm')}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-white/15 mx-auto mb-2" />
            <p className="text-white/40 text-sm">User tidak ditemukan</p>
            <p className="text-white/25 text-xs mt-1">Coba ubah filter pencarian</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-white/50 border border-white/10 hover:bg-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="lg:hidden"><BottomNav /></div>
      </div>

      {/* Kill Switch Confirmation Modal */}
      {showKillSwitchConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-5 max-w-xs w-full border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                killSwitchAction === 'block' ? 'bg-red-500/20' : 'bg-emerald-500/20'
              }`}>
                {killSwitchAction === 'block'
                  ? <ShieldX className="w-7 h-7 text-red-400" />
                  : <ShieldCheck className="w-7 h-7 text-emerald-400" />}
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {killSwitchAction === 'block' ? 'Aktifkan Kill Switch?' : 'Nonaktifkan Kill Switch?'}
              </h3>
              <p className="text-white/50 text-xs mb-5">
                {killSwitchAction === 'block'
                  ? 'Semua user kecuali superadmin akan diblokir dari submit inspection.'
                  : 'Semua user akan bisa submit inspection lagi.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKillSwitchConfirm(false)}
                  className="flex-1 px-3 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleKillSwitch}
                  className={`flex-1 px-3 py-2.5 text-white text-sm rounded-xl font-medium transition-colors ${
                    killSwitchAction === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {killSwitchAction === 'block' ? 'Block Semua' : 'Unblock Semua'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-5 max-w-xs w-full border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                resultModal.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}>
                {resultModal.type === 'success'
                  ? <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  : <XCircle className="w-7 h-7 text-red-400" />}
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {resultModal.type === 'success' ? 'Berhasil!' : 'Gagal!'}
              </h3>
              <p className="text-white/50 text-xs mb-5">{resultModal.message}</p>
              <button
                onClick={() => setResultModal(null)}
                className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm rounded-xl font-medium transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
