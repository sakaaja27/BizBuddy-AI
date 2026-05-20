import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Package, Sparkles } from 'lucide-react';

const BottomNav = () => {
  const menuItems = [
    { name: 'Beranda', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Analitik', icon: BarChart2, path: '/analytics' },
    { name: 'Stok', icon: Package, path: '/stock' },
    { name: 'Insights', icon: Sparkles, path: '/insights', isAi: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex items-center justify-around pb-safe md:hidden z-30 pb-2 pt-2 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
      {menuItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center p-2 rounded-xl transition-all duration-200 min-w-[64px]
            ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}
          `}
        >
          {({ isActive }) => (
            <>
              <div className={`
                p-1.5 rounded-lg mb-1 transition-colors
                ${isActive && item.isAi ? 'bg-orange-100 text-orange-600' : ''}
                ${isActive && !item.isAi ? 'bg-primary/10 text-primary' : ''}
              `}>
                <item.icon size={22} className={item.isAi && !isActive ? 'text-orange-400' : ''} />
              </div>
              <span className={`text-[10px] font-medium ${item.isAi && !isActive ? 'text-orange-500 font-bold' : ''}`}>
                {item.name}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;
