import React, { useState, useEffect, useMemo } from 'react';
import adminApi from '../api/admin';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserPlus, Shield, ShieldCheck, Key, Edit3, Trash2, Eye,
  Calendar, Check, X, AlertCircle, Sparkles, RefreshCw, Flame,
  Activity, ArrowRight, Lock, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

const AdminUsers = () => {
  const { user: currentAdmin } = useAuth();

  const [usersData, setUsersData] = useState({ total_users: 0, max_allowed: 10, users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    calorie_target: 2000,
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    calorie_target: 2000,
    is_active: true,
  });

  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Diary Inspection State
  const [inspectDate, setInspectDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [inspectDiary, setInspectDiary] = useState(null);
  const [diaryLoading, setDiaryLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getUsers();
      setUsersData(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Add Member
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await adminApi.createUser({
        ...addForm,
        calorie_target: parseFloat(addForm.calorie_target) || 2000,
      });
      setShowAddModal(false);
      setAddForm({ username: '', email: '', full_name: '', password: '', calorie_target: 2000 });
      showNotification(`Member account '@${addForm.username}' created!`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create member.');
    }
  };

  // Edit User
  const handleEditOpen = (u) => {
    setSelectedUser(u);
    setEditForm({
      full_name: u.full_name || '',
      email: u.email || '',
      calorie_target: u.calorie_target || 2000,
      is_active: u.is_active,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateUser(selectedUser.id, {
        ...editForm,
        calorie_target: parseFloat(editForm.calorie_target) || 2000,
      });
      setShowEditModal(false);
      showNotification(`Updated profile for ${editForm.full_name || selectedUser.username}.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update member.');
    }
  };

  // Reset Password
  const handleResetOpen = (u) => {
    setSelectedUser(u);
    setResetPasswordVal('');
    setShowResetModal(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (resetPasswordVal.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      await adminApi.updateUser(selectedUser.id, {
        reset_password: resetPasswordVal,
      });
      setShowResetModal(false);
      showNotification(`Password reset for '@${selectedUser.username}'. They will be forced to change it on next login.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    }
  };

  // Delete User
  const handleDelete = async (u) => {
    if (u.id === currentAdmin?.id) {
      alert('You cannot delete your own Super Admin account.');
      return;
    }
    const confirm = window.confirm(
      `Are you sure you want to delete member '@${u.username}' (${u.full_name})? This will permanently delete all their diary entries and custom meals.`
    );
    if (!confirm) return;

    try {
      await adminApi.deleteUser(u.id);
      showNotification(`User '@${u.username}' has been deleted.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  // Inspect Diary Modal
  const handleInspectOpen = async (u) => {
    setSelectedUser(u);
    setShowDiaryModal(true);
    fetchMemberDiary(u.id, inspectDate);
  };

  const fetchMemberDiary = async (userId, dateStr) => {
    setDiaryLoading(true);
    try {
      const data = await adminApi.getUserDiary(userId, dateStr);
      setInspectDiary(data);
    } catch (err) {
      console.error('Failed to load member diary:', err);
    } finally {
      setDiaryLoading(false);
    }
  };

  const handleDateChange = (daysDelta) => {
    const current = new Date(inspectDate);
    const updated = daysDelta > 0 ? addDays(current, daysDelta) : subDays(current, Math.abs(daysDelta));
    const newDateStr = format(updated, 'yyyy-MM-dd');
    setInspectDate(newDateStr);
    if (selectedUser) {
      fetchMemberDiary(selectedUser.id, newDateStr);
    }
  };

  const isMaxReached = usersData.total_users >= (usersData.max_allowed || 10);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#18181B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-700 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Header with Capacity Badge & Actions */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-gray-200/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600">
              <Users size={18} />
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              User Management
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-medium max-w-xl">
            Admin portal to manage up to 10 user accounts, inspect food diaries, and assign personal calorie targets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Capacity Pill Meter */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200/80 px-4 py-2 rounded-2xl">
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">
                Capacity
              </div>
              <div className="text-sm font-black text-gray-900">
                {usersData.total_users} <span className="text-gray-400 font-medium">/ {usersData.max_allowed || 10} Users</span>
              </div>
            </div>
            <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isMaxReached ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (usersData.total_users / (usersData.max_allowed || 10)) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Add User Button */}
          <button
            onClick={() => setShowAddModal(true)}
            disabled={isMaxReached}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
              isMaxReached
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#18181B] hover:bg-black text-white shadow-gray-200 hover:scale-[1.02]'
            }`}
          >
            <UserPlus size={15} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Users Table / Card Grid */}
      <div className="bg-white rounded-3xl border border-gray-200/70 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Enrolled Accounts</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
              {usersData.users.length}
            </span>
          </h2>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <span className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
            <span className="text-xs font-medium">Loading user accounts...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Target Cal</th>
                  <th className="py-3 px-4">Today Consumed</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {usersData.users.map((u) => {
                  const initials = (u.full_name || u.username)
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  const isCurrentAdmin = u.id === currentAdmin?.id;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* User Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{u.full_name || u.username}</span>
                              {isCurrentAdmin && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium">
                              @{u.username} &bull; {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 font-bold text-[11px]">
                            <Shield size={12} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-600 font-semibold text-[11px]">
                            Member
                          </span>
                        )}
                      </td>

                      {/* Calorie Target */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-800 flex items-center gap-1">
                          <Flame size={13} className="text-amber-500" />
                          <span>{Math.round(u.calorie_target || 2000)} kcal</span>
                        </div>
                      </td>

                      {/* Today's Calories */}
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-gray-900">
                          {Math.round(u.stats?.today_calories || 0)} kcal
                        </span>
                      </td>

                      {/* Activity metrics */}
                      <td className="py-4 px-4">
                        <div className="text-[11px] text-gray-500">
                          <span className="font-bold text-gray-700">{u.stats?.total_days_logged || 0}</span> days &bull;{' '}
                          <span className="font-bold text-gray-700">{u.stats?.total_entries || 0}</span> meals
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {u.must_change_password ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-amber-700 font-semibold text-[10px]" title="User must change password on next login">
                            <Key size={10} /> Needs Pwd Change
                          </span>
                        ) : u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Inactive
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Diary */}
                          <button
                            onClick={() => handleInspectOpen(u)}
                            className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Inspect Food Diary"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetOpen(u)}
                            className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Reset Temporary Password"
                          >
                            <Key size={15} />
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => handleEditOpen(u)}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            title="Edit Member Details"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete User */}
                          {!isCurrentAdmin && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Member"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ADD MEMBER MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Add New Member</h3>
                  <p className="text-xs text-gray-400">Slot {usersData.total_users + 1} of {usersData.max_allowed || 10}</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@calori.app"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Daily Calorie Target</label>
                  <input
                    type="number"
                    required
                    min={800}
                    max={6000}
                    placeholder="2000"
                    value={addForm.calorie_target}
                    onChange={(e) => setAddForm({ ...addForm, calorie_target: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Temporary Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Set initial password (min 6 chars)"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-800">
                <ShieldCheck size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>First Login Rule:</strong> When this member logs in with this temporary password, they will be <em>strictly required</em> to change it immediately before accessing the application.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT MEMBER MODAL ─── */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gray-100 text-gray-800 flex items-center justify-center font-bold">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Edit Member</h3>
                  <p className="text-xs text-gray-400">@{selectedUser.username}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Daily Calorie Target (kcal)</label>
                <input
                  type="number"
                  required
                  min={800}
                  max={6000}
                  value={editForm.calorie_target}
                  onChange={(e) => setEditForm({ ...editForm, calorie_target: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {selectedUser.id !== currentAdmin?.id && (
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-xs font-bold text-gray-700">Account is Active</span>
                  </label>
                  <p className="text-[11px] text-gray-400 pl-6 mt-0.5">
                    Deactivated members cannot sign in.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RESET PASSWORD MODAL ─── */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Reset Password</h3>
                  <p className="text-xs text-gray-400">@{selectedUser.username}</p>
                </div>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Temporary Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Set temporary password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200/70 rounded-2xl flex items-start gap-2.5 text-[11px] text-blue-800">
                <AlertCircle size={15} className="shrink-0 text-blue-600 mt-0.5" />
                <span>
                  After resetting, the user will be forced to change this password as soon as they sign in.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Set & Force Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── INSPECT MEMBER DIARY MODAL ─── */}
      {showDiaryModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
                  {selectedUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <span>{selectedUser.full_name || selectedUser.username}</span>
                    <span className="text-xs font-normal text-gray-400">(@{selectedUser.username})</span>
                  </h3>
                  <p className="text-xs text-gray-500">Member Food Diary Inspection</p>
                </div>
              </div>
              <button onClick={() => setShowDiaryModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-2xl border border-gray-200/80 mb-6">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-1.5 rounded-xl hover:bg-white text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <Calendar size={14} className="text-amber-500" />
                <span>{inspectDate}</span>
              </div>
              <button
                onClick={() => handleDateChange(1)}
                className="p-1.5 rounded-xl hover:bg-white text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {diaryLoading ? (
              <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs">Loading diary entries...</span>
              </div>
            ) : inspectDiary ? (
              <div className="space-y-5">
                {/* Total Stats Banner */}
                <div className="grid grid-cols-4 gap-2 bg-[#18181B] text-white p-4 rounded-2xl text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Calories</div>
                    <div className="text-base font-black text-amber-400">
                      {Math.round(inspectDiary.totals?.calories || 0)} kcal
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Protein</div>
                    <div className="text-base font-black text-rose-300">
                      {Math.round(inspectDiary.totals?.protein || 0)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Carbs</div>
                    <div className="text-base font-black text-amber-200">
                      {Math.round(inspectDiary.totals?.carbohydrates || 0)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Fat</div>
                    <div className="text-base font-black text-emerald-300">
                      {Math.round(inspectDiary.totals?.fat || 0)}g
                    </div>
                  </div>
                </div>

                {/* Meals Breakdown */}
                {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                  const items = inspectDiary.entries?.[mealType] || [];
                  const mealCal = items.reduce((acc, curr) => acc + (curr.calories || 0), 0);

                  return (
                    <div key={mealType} className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                          {mealType} ({items.length})
                        </span>
                        <span className="text-xs font-bold text-amber-600">
                          {Math.round(mealCal)} kcal
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">No food logged for {mealType}.</p>
                      ) : (
                        <div className="space-y-1.5 mt-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white p-2.5 rounded-xl border border-gray-200/60 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-gray-800">
                                  {item.food?.name || 'Item'}
                                </span>
                                <span className="text-gray-400 text-[11px] ml-2">
                                  ({item.quantity_display} {item.quantity_unit})
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                                <span>P: {Math.round(item.protein || 0)}g</span>
                                <span>C: {Math.round(item.carbohydrates || 0)}g</span>
                                <span>F: {Math.round(item.fat || 0)}g</span>
                                <span className="font-bold text-gray-900 ml-1">
                                  {Math.round(item.calories || 0)} kcal
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No diary records found for this date.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
