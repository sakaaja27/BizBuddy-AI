import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Package, Wallet, Sparkles, HelpCircle, Settings, ShoppingBag, Bot, X } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'B';
  const isPremium = user?.plan === 'premium' || user?.plan === 'enterprise';

  const menuItems = [
    { name: 'Beranda', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Pesanan', icon: ShoppingBag, path: '/dashboard/orders' },
    { name: 'Analitik', icon: BarChart2, path: '/dashboard/analytics' },
    { name: 'Stok', icon: Package, path: '/dashboard/inventory' },
    { name: 'Keuangan', icon: Wallet, path: '/dashboard/finance' },
    { name: 'Review Intelligence', icon: Sparkles, path: '/dashboard/reviews' },
    { name: 'AI Assistant', icon: Bot, path: '/dashboard/ai-assistant', isAi: true },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Top Profile Section */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-primary/30">
              {initial}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight truncate w-32">{user?.businessName}</h3>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block mt-1 ${isPremium ? 'bg-orange-100 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                {isPremium ? '⭐ Premium Plan' : 'Free Plan'}
              </span>
            </div>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => { if(window.innerWidth < 768) onClose(); }}
            className={({ isActive }) => `
              flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative
              ${isActive 
                ? 'bg-primary/5 text-primary' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full ${item.isAi ? 'bg-orange-500' : 'bg-primary'}`}></div>
                )}
                <item.icon 
                  size={20} 
                  className={`mr-3 ${item.isAi ? (isActive ? 'text-orange-500' : 'text-orange-400') : (isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600')}`} 
                />
                <span className={`font-medium ${item.isAi ? (isActive ? 'text-orange-600 font-bold' : 'text-orange-500 font-semibold') : ''}`}>{item.name}</span>
                {item.isAi && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-50 space-y-4">
        {!isPremium && (
          <button 
            onClick={() => { navigate('/dashboard/upgrade'); if(window.innerWidth < 768) onClose(); }}
            className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
          >
            <Sparkles size={18} className="mr-2" />
            Upgrade Bisnis
          </button>
        )}
        <button 
          onClick={() => { navigate('/dashboard/settings'); if(window.innerWidth < 768) onClose(); }}
          className="flex items-center w-full px-4 py-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Settings size={20} className="mr-3 text-gray-400" />
          <span className="font-medium">Pengaturan</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
