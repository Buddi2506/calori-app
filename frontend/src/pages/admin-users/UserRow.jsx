import React from 'react';
import { Shield, Key, Edit3, Trash2, Eye, Flame } from 'lucide-react';

// One account in the users table, with its action buttons.
const UserRow = ({ u, currentAdmin, onInspect, onReset, onEdit, onDelete }) => {
  const initials = (u.full_name || u.username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const isCurrentAdmin = u.id === currentAdmin?.id;

  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
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
            onClick={() => onInspect(u)}
            className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Inspect Food Diary"
          >
            <Eye size={15} />
          </button>

          {/* Reset Password */}
          <button
            onClick={() => onReset(u)}
            className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Reset Temporary Password"
          >
            <Key size={15} />
          </button>

          {/* Edit User */}
          <button
            onClick={() => onEdit(u)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            title="Edit Member Details"
          >
            <Edit3 size={15} />
          </button>

          {/* Delete User */}
          {!isCurrentAdmin && (
            <button
              onClick={() => onDelete(u)}
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
};

export default UserRow;
