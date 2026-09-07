import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Utensils, Target, BarChart2, ListFilter, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    { path: '/', label: 'Overview', icon: Home },
    { path: '/diary', label: 'Diary', icon: BookOpen },
    { path: '/foods', label: 'Foods', icon: ListFilter },
    { path: '/meals', label: 'Meals', icon: Utensils },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/reports', label: 'Reports', icon: BarChart2 },
    ...(isAdmin ? [{ path: '/admin/users', label: 'Users', icon: Users }] : []),
  ];
  return (
    <>
      {/* Mobile Floating Bottom Pill Nav (Zentra Mobile Style) */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-full shadow-lg p-1.5 flex justify-around items-center z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all ${
                  isActive 
                    ? 'bg-[#18181B] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              <span className="text-[9px] font-bold mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;
