import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Users, Shield, LogOut, Flame, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/diary', label: 'Food Diary' },
    { path: '/foods', label: 'Food List (662)' },
    { path: '/meals', label: 'Custom Meals' },
    { path: '/goals', label: 'Goals' },
    { path: '/reports', label: 'Reports' },
    ...(isAdmin ? [{ path: '/admin/users', label: 'Users' }] : []),
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = (user?.full_name || user?.username || 'NK')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-[#ECEEF1] py-4 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-6 lg:gap-10">
        {/* Brand Logo with Orange Squircle */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            C
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900">calori</span>
        </NavLink>

        {/* Desktop Top Navigation with Solid Black Active Pill */}
        <nav className="hidden md:flex items-center gap-1 bg-white/60 p-1 rounded-full border border-gray-200/60 shadow-sm backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#18181B] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100/60'
                }`}
              >
                {item.path === '/admin/users' && <Users size={12} className={isActive ? 'text-amber-400' : 'text-amber-600'} />}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Right Action Icons & Profile Dropdown */}
      <div className="flex items-center gap-2.5">
        {/* Search Icon */}
        <NavLink
          to="/foods"
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200/80 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          title="Search Food Library"
        >
          <Search size={16} />
        </NavLink>

        {/* Notifications Icon with Amber Dot */}
        <button
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200/80 text-gray-600 hover:text-gray-900 hover:bg-gray-50 relative transition-colors"
          title="Daily Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile Avatar with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 rounded-full ring-2 ring-amber-500/50 p-0.5 bg-white shadow-sm hover:scale-105 transition-transform flex items-center justify-center focus:outline-none"
            title="User Profile & Settings"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-400 via-rose-300 to-emerald-400 flex items-center justify-center text-[11px] font-black text-white shadow-inner">
              {initials}
            </div>
          </button>

          {/* Glass Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white/95 backdrop-blur-xl rounded-2xl p-3 border border-gray-200/80 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
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
                <div className="text-[11px] text-gray-400 truncate">
                  @{user?.username}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50/70 px-2.5 py-1 rounded-xl">
                  <Flame size={12} className="text-amber-500 shrink-0" />
                  <span>Daily Target: {Math.round(user?.calorie_target || 2000)} kcal</span>
                </div>
              </div>

              {/* Admin direct link */}
              {isAdmin && (
                <NavLink
                  to="/admin/users"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100/70 rounded-xl transition-colors mb-1"
                >
                  <Users size={14} className="text-amber-500" />
                  <span>Manage Users & Diaries</span>
                </NavLink>
              )}

              {/* Sign Out Action */}
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
      </div>
    </header>
  );
};

export default Navbar;
