import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, Shield, LogOut, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const userInitials = (user) => (user?.full_name || user?.username || 'NK')
  .split(' ')
  .map((n) => n[0])
  .join('')
  .substring(0, 2)
  .toUpperCase();

// Account menu: who is signed in, their calorie target, admin link and sign out.
// `variant="avatar"` is the round button in the phone header (menu opens below);
// `variant="card"` is the user card at the bottom of the side rail (menu opens above).
const UserMenu = ({ variant = 'avatar' }) => {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const initials = userInitials(user);
  const target = Math.round(user?.calorie_target || 2000);

  return (
    <div className="relative" ref={ref}>
      {variant === 'card' ? (
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
        >
          <span className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-black text-gray-900 shrink-0">
            {initials}
          </span>
          <span className="min-w-0 flex flex-col">
            <span className="text-[13px] font-bold text-gray-900 truncate">{user?.full_name || user?.username}</span>
            <span className="text-xs text-gray-500">Goal {target.toLocaleString()} kcal</span>
          </span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Account menu"
          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-black text-gray-900 hover:scale-105 transition-transform"
        >
          {initials}
        </button>
      )}

      {open && (
        <div
          className={`absolute w-64 bg-white/95 backdrop-blur-xl rounded-2xl p-3 border border-gray-200/80 shadow-2xl z-50 ${
            variant === 'card' ? 'bottom-full mb-2 left-0' : 'right-0 mt-2.5'
          }`}
        >
          <div className="p-2 border-b border-gray-100 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-900 truncate">
                {user?.full_name || user?.username}
              </span>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">
                  <Shield size={10} /> Admin
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Member
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 truncate">@{user?.username}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50/70 px-2.5 py-1 rounded-xl">
              <Flame size={12} className="text-amber-500 shrink-0" />
              <span>Daily Target: {target} kcal</span>
            </div>
          </div>

          {isAdmin && (
            <NavLink
              to="/admin/users"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100/70 rounded-xl transition-colors mb-1"
            >
              <Users size={14} className="text-amber-500" />
              <span>Manage Users & Diaries</span>
            </NavLink>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
