import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import BottomNav from './BottomNav';

const DashboardLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      {/* Main Content Wrapper - with margin left to account for fixed sidebar on desktop */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300 w-full">
        <TopNavbar toggleMobileMenu={toggleMobileMenu} />
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 w-full max-w-[1600px] mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
