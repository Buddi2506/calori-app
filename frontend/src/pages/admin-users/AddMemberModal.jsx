import React from 'react';
import { UserPlus, ShieldCheck, X } from 'lucide-react';

// Create a member account with a temporary password.
const AddMemberModal = ({ usersData, addForm, setAddForm, onSubmit, onClose }) => {
  return (
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0B0C10] rounded-xl text-xs font-bold shadow-sm"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
