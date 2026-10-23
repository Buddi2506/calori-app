import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Dumbbell, ListFilter, Utensils, Target, BarChart2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';

// Desktop navigation (md and up): logo, page links and the account card.
const SideRail = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home, end: true },
    { path: '/diary', label: 'Food diary', icon: BookOpen },
    { path: '/workouts', label: 'Workouts', icon: Dumbbell },
    { path: '/foods', label: 'Food list', icon: ListFilter },
    { path: '/meals', label: 'Custom meals', icon: Utensils },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/reports', label: 'Reports', icon: BarChart2 },
    ...(isAdmin ? [{ path: '/admin/users', label: 'Users', icon: Users }] : []),
  ];

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-60 shrink-0 flex-col gap-7 px-4 py-6 border-r border-gray-100 bg-[#0E0F13]">
      <NavLink to="/" className="flex items-center gap-2.5 px-2 group">
        <span className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-[#0B0C10] font-black text-sm group-hover:scale-105 transition-transform">
          C
        </span>
        <span className="text-xl font-black tracking-tight text-gray-900">calori</span>
      </NavLink>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 h-11 px-3 rounded-2xl text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-50 text-gray-900 font-bold ring-1 ring-inset ring-gray-200'
                    : 'text-gray-600 font-semibold hover:text-gray-900 hover:bg-gray-50/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-amber-400' : ''} />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto">
        <UserMenu variant="card" />
      </div>
    </aside>
  );
};

export default SideRail;
