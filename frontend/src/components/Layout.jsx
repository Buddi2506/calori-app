import React from 'react';
import { Outlet } from 'react-router-dom';
import SideRail from './SideRail';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen text-gray-900 flex selection:bg-amber-400 selection:text-[#030407]">
      {/* Desktop side navigation */}
      <SideRail />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Phone header */}
        <Navbar />

        {/* Main Page Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-7 pb-24 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile Floating Pill Navigation */}
      <Sidebar />
    </div>
  );
};

export default Layout;
