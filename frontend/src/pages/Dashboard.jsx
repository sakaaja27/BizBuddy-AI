import React from 'react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Package, Star } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🤖</span>
              <span className="font-bold text-xl text-secondary">BizBuddy</span>
              <span className="font-bold text-xl text-accent">AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Halo, {user?.name || 'Seller'}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-danger"
              >
                <LogOut size={18} className="mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5 flex items-center">
                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-md">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Produk</dt>
                    <dd className="text-lg font-medium text-gray-900">0</dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5 flex items-center">
                <div className="flex-shrink-0 bg-success/10 p-3 rounded-md">
                  <LayoutDashboard className="h-6 w-6 text-success" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pesanan Baru</dt>
                    <dd className="text-lg font-medium text-gray-900">0</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5 flex items-center">
                <div className="flex-shrink-0 bg-warning/10 p-3 rounded-md">
                  <Star className="h-6 w-6 text-warning" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rating Toko</dt>
                    <dd className="text-lg font-medium text-gray-900">-</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
              <p>Belum ada data untuk ditampilkan.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
