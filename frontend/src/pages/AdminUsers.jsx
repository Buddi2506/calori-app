import React, { useState, useEffect } from 'react';
import adminApi from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import UsersHeader from './admin-users/UsersHeader';
import UserRow from './admin-users/UserRow';
import AddMemberModal from './admin-users/AddMemberModal';
import EditMemberModal from './admin-users/EditMemberModal';
import ResetPasswordModal from './admin-users/ResetPasswordModal';
import MemberDiaryModal from './admin-users/MemberDiaryModal';

const AdminUsers = () => {
  const { user: currentAdmin } = useAuth();

  const [usersData, setUsersData] = useState({ total_users: 0, max_allowed: 10, users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, showNotification] = useToast(4000);

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
    setError('');
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
    setError('');
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
    const current = parseISO(inspectDate); // local date; new Date('yyyy-MM-dd') would be UTC
    const updated = daysDelta > 0 ? addDays(current, daysDelta) : subDays(current, Math.abs(daysDelta));
    const newDateStr = format(updated, 'yyyy-MM-dd');
    setInspectDate(newDateStr);
    if (selectedUser) {
      fetchMemberDiary(selectedUser.id, newDateStr);
    }
  };

  const isMaxReached = usersData.total_users >= (usersData.max_allowed || 10);
  const modalOpen = showAddModal || showEditModal || showResetModal;

  return (
    <div className="flex flex-col gap-5">
      <Toast message={successMsg} />

      <UsersHeader usersData={usersData} isMaxReached={isMaxReached} onAdd={() => { setError(''); setShowAddModal(true); }} />

      {/* Error Alert */}
      {error && !modalOpen && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} aria-label="Dismiss" className="text-rose-700 hover:text-rose-600">
            <X size={14} />
          </button>
        </div>
      )}

      <section className="zentra-card !rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-gray-900">
            Accounts <span className="text-sm font-bold text-gray-500">{usersData.users.length}</span>
          </h2>
          <button
            onClick={fetchUsers}
            disabled={loading}
            aria-label="Refresh list"
            className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <p className="p-12 text-center text-sm text-gray-500">Loading accounts…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-500">
                  <th className="py-3 px-5 font-bold">Member</th>
                  <th className="py-3 px-4 font-bold">Role</th>
                  <th className="py-3 px-4 font-bold">Today</th>
                  <th className="py-3 px-4 font-bold">Activity</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {usersData.users.map((u) => (
                  <UserRow
                    key={u.id}
                    u={u}
                    currentAdmin={currentAdmin}
                    onInspect={handleInspectOpen}
                    onReset={handleResetOpen}
                    onEdit={handleEditOpen}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAddModal && (
        <AddMemberModal
          usersData={usersData}
          error={error}
          addForm={addForm}
          setAddForm={setAddForm}
          onSubmit={handleAddSubmit}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && selectedUser && (
        <EditMemberModal
          selectedUser={selectedUser}
          error={error}
          currentAdmin={currentAdmin}
          editForm={editForm}
          setEditForm={setEditForm}
          onSubmit={handleEditSubmit}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showResetModal && selectedUser && (
        <ResetPasswordModal
          selectedUser={selectedUser}
          error={error}
          resetPasswordVal={resetPasswordVal}
          setResetPasswordVal={setResetPasswordVal}
          onSubmit={handleResetSubmit}
          onClose={() => setShowResetModal(false)}
        />
      )}

      {showDiaryModal && selectedUser && (
        <MemberDiaryModal
          selectedUser={selectedUser}
          inspectDate={inspectDate}
          inspectDiary={inspectDiary}
          diaryLoading={diaryLoading}
          onDateChange={handleDateChange}
          onClose={() => setShowDiaryModal(false)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
