import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, LogOut, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TopNavbar = ({ toggleMobileMenu }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const avatar = user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=FF6B35&color=fff`;

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await axios.get('/products');
        const lowStock = data.filter(p => p.stock <= p.minStock);
        const notifs = [];
        if (lowStock.length > 0) {
          notifs.push({
            id: Date.now(),
            title: 'Peringatan Stok',
            message: `${lowStock.length} produk menipis! Segera restock.`,
            type: 'warning'
          });
        } else {
          notifs.push({
            id: Date.now(),
            title: 'Sistem Optimal',
            message: 'Semua sistem dan stok berjalan dengan baik.',
            type: 'success'
          });
        }
        setNotifications(notifs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-8 w-full">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={toggleMobileMenu}
        className="md:hidden text-gray-500 hover:text-gray-900 p-2"
      >
        <Menu size={24} />
      </button>

      {/* Search Bar Removed as requested */}
      <div className="flex-1"></div>

      {/* Right Icons */}
      <div className="flex items-center space-x-3 sm:space-x-5 relative">
        
        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors rounded-full hover:bg-gray-100"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-[90vw] sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-fade-in">
              <div className="px-4 pb-2 border-b border-gray-50 flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-900">Notifikasi</h3>
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="text-xs text-primary font-semibold hover:text-orange-600 transition-colors">
                    Bersihkan
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto px-2">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    Tidak ada notifikasi baru.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="px-3 py-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors flex gap-3 items-start mb-1">
                      <div className={`p-2 rounded-full shrink-0 ${notif.type === 'warning' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
                        {notif.type === 'warning' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-0.5">{notif.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 ring-primary transition-all"
          >
            <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-[90vw] sm:w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Login Sebagai</p>
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@bizbuddy.ai'}</p>
              </div>
              
              <div className="px-2">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center"
                >
                  <LogOut size={16} className="mr-2" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default TopNavbar;
