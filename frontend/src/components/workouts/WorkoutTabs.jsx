import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/workouts', label: 'Today' },
  { to: '/workouts/history', label: 'History' },
  { to: '/workouts/progress', label: 'Progress' },
];

// Today / History / Progress switcher shown at the top of the workout pages.
const WorkoutTabs = () => {
  const { pathname } = useLocation();
  const activeFor = (to) => {
    if (to === '/workouts') return /^\/workouts(\/\d{4}-\d{2}-\d{2})?$/.test(pathname);
    return pathname.startsWith(to);
  };
  return (
    <nav aria-label="Workout sections" className="flex gap-1 bg-gray-100 p-1 rounded-full self-start">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          aria-current={activeFor(t.to) ? 'page' : undefined}
          className={`px-4 h-9 flex items-center rounded-full text-xs font-bold transition-colors ${
            activeFor(t.to) ? 'pill-active' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default WorkoutTabs;
