import React from 'react';
import { Key, Pencil, Trash2, BookOpen } from 'lucide-react';
import { userInitials } from '../../components/UserMenu';

const IconButton = ({ label, onClick, danger, children }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors ${danger ? 'hover:text-rose-600' : 'hover:text-gray-900'}`}
  >
    {children}
  </button>
);

// One account in the members table, with its action buttons.
const UserRow = ({ u, currentAdmin, onInspect, onReset, onEdit, onDelete }) => {
  const isCurrentAdmin = u.id === currentAdmin?.id;
  const today = Math.round(u.stats?.today_calories || 0);
  const target = Math.round(u.calorie_target || 2000);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-amber-400 text-[#0B0C10] font-black text-xs flex items-center justify-center shrink-0">
            {userInitials(u)}
          </span>
          <div className="min-w-0">
            <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <span className="truncate">{u.full_name || u.username}</span>
              {isCurrentAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">You</span>}
            </div>
            <div className="text-xs text-gray-500 truncate">@{u.username} · {u.email}</div>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-4">
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${u.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
          {u.role === 'admin' ? 'Admin' : 'Member'}
        </span>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className="font-extrabold text-gray-900">{today.toLocaleString()}</span>
        <span className="text-gray-500"> / {target.toLocaleString()} kcal</span>
      </td>

      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
        <span className="font-bold text-gray-700">{u.stats?.total_days_logged || 0}</span> days ·{' '}
        <span className="font-bold text-gray-700">{u.stats?.total_entries || 0}</span> entries
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap">
        {u.must_change_password ? (
          <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold text-[11px]" title="Must change password at next sign-in">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> New password needed
          </span>
        ) : u.is_active ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Inactive
          </span>
        )}
      </td>

      <td className="py-3.5 px-5">
        <div className="flex items-center justify-end">
          <IconButton label={`View diary of ${u.username}`} onClick={() => onInspect(u)}><BookOpen size={16} /></IconButton>
          <IconButton label={`Reset password for ${u.username}`} onClick={() => onReset(u)}><Key size={16} /></IconButton>
          <IconButton label={`Edit ${u.username}`} onClick={() => onEdit(u)}><Pencil size={16} /></IconButton>
          {!isCurrentAdmin && (
            <IconButton label={`Delete ${u.username}`} onClick={() => onDelete(u)} danger><Trash2 size={16} /></IconButton>
          )}
        </div>
      </td>
    </tr>
  );
};

export default UserRow;
