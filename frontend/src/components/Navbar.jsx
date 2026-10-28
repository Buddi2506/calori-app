import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search } from 'lucide-react';
import UserMenu from './UserMenu';

// Phone header (below md): logo, food search and the account menu.
// Page links live in the bottom pill nav (Sidebar); desktop uses the SideRail instead.
const Navbar = () => (
  <header className="md:hidden bg-[#030407]/80 backdrop-blur-md border-b border-[#fff]/[0.04] py-3 px-4 flex items-center justify-between sticky top-0 z-30">
    <NavLink to="/" className="flex items-center gap-2.5 group">
      <span className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-[#030407] font-black text-sm">
        C
      </span>
      <span className="text-xl font-black tracking-tight text-gray-900">calori</span>
    </NavLink>

    <div className="flex items-center gap-2.5">
      <NavLink
        to="/foods"
        aria-label="Search food library"
        className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200/80 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Search size={16} />
      </NavLink>
      <UserMenu variant="avatar" />
    </div>
  </header>
);

export default Navbar;
