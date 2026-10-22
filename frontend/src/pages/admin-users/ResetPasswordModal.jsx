import React from 'react';
import { Key, X, AlertCircle } from 'lucide-react';

// Set a temporary password the member must change at next sign-in.
const ResetPasswordModal = ({ selectedUser, resetPasswordVal, setResetPasswordVal, onSubmit, onClose }) => {
  return (
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
              onClick={onClose}
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
  );
};

export default ResetPasswordModal;
