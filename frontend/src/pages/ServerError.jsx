import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';

const ServerError = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <div className="text-center animate-page-enter max-w-lg">
        {/* Animated 500 */}
        <div className="relative mb-8">
          <h1 className="text-[160px] md:text-[200px] font-black text-gray-100 leading-none select-none">500</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl">⚙️</div>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Terjadi Kesalahan Server</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Maaf, server sedang mengalami masalah. Tim kami sedang bekerja untuk memperbaikinya. Coba lagi dalam beberapa saat.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center"
          >
            <RefreshCw size={18} className="mr-2" />
            Coba Lagi
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 flex items-center justify-center"
          >
            <Home size={18} className="mr-2" />
            Ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
