import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const TopNavbar = ({ toggleMobileMenu }) => {
  const { user } = useAuthStore();
  const avatar = user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=FF6B35&color=fff`;

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-8 w-full">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={toggleMobileMenu}
        className="md:hidden text-gray-500 hover:text-gray-900 p-2"
      >
        <Menu size={24} />
      </button>

      {/* Search Bar (Center/Left) */}
      <div className="flex-1 flex justify-start md:justify-center px-4 max-w-2xl ml-auto md:ml-0">
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            className="block w-full pl-10 pr-3 py-2 border-transparent bg-gray-100 text-gray-900 rounded-full focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all sm:text-sm" 
            placeholder="Cari menu, produk, atau pesanan..." 
          />
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center space-x-3 sm:space-x-5">
        <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors rounded-full hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-danger ring-2 ring-white"></span>
        </button>
        <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 ring-primary transition-all">
          <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
