import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#ECEEF1] text-gray-900 flex flex-col selection:bg-amber-500 selection:text-white">
      {/* Zentra Top Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* Mobile Floating Pill Navigation */}
      <Sidebar />
    </div>
  );
};

export default Layout;
