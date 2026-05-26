import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <div className="text-center animate-page-enter max-w-lg">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[160px] md:text-[200px] font-black text-gray-100 leading-none select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl animate-bounce">🔍</div>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Halaman yang Anda cari mungkin sudah dipindahkan, dihapus, atau tidak pernah ada. Coba kembali ke dashboard.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Kembali
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

export default NotFound;
