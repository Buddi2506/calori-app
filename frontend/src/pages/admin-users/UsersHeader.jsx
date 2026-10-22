import React from 'react';
import { Users, UserPlus } from 'lucide-react';

// Title, capacity meter and the Add Member button.
const UsersHeader = ({ usersData, isMaxReached, onAdd }) => {
  return (
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
          onClick={onAdd}
          disabled={isMaxReached}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
            isMaxReached
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-amber-400 hover:bg-amber-300 text-[#0B0C10] shadow-gray-200 hover:scale-[1.02]'
          }`}
        >
          <UserPlus size={15} />
          <span>Add Member</span>
        </button>
      </div>
    </div>
  );
};

export default UsersHeader;
