import React from 'react';
import { Edit3, X } from 'lucide-react';

// Edit a member's name, email, calorie target and active status.
const EditMemberModal = ({ selectedUser, currentAdmin, editForm, setEditForm, onSubmit, onClose }) => {
  return (
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0B0C10] rounded-xl text-xs font-bold shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;
