import React from 'react';
import { format } from 'date-fns';

const Navbar = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-2xl">🥗</span>
        <h1 className="text-xl font-bold text-primary-dark">Calori</h1>
      </div>
      <div className="hidden md:flex items-center">
        <h2 className="text-lg font-medium text-gray-700">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {/* Could add a quick summary here later */}
      </div>
    </header>
  );
};

export default Navbar;
