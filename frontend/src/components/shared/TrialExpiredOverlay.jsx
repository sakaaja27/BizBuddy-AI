import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const TrialExpiredOverlay = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-gray-50 p-8 text-center border-b border-gray-100">
          <span className="text-6xl mb-4 block">😢</span>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Trial Premium Kamu Sudah Berakhir</h2>
          <p className="text-gray-500 text-sm">Semoga 30 hari terakhir bermanfaat untuk bisnismu!</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-sm font-bold text-gray-700 mb-4 text-center">Fitur berikut kini telah terkunci:</p>
          
          <ul className="space-y-4 mb-6">
            <li className="flex items-center text-gray-500 text-sm font-medium">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 shrink-0">
                <Lock size={14} className="text-gray-400" />
              </div>
              AI Daily Report & Chat unlimited
            </li>
            <li className="flex items-center text-gray-500 text-sm font-medium">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 shrink-0">
                <Lock size={14} className="text-gray-400" />
              </div>
              Export PDF & Excel
            </li>
            <li className="flex items-center text-gray-500 text-sm font-medium">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 shrink-0">
                <Lock size={14} className="text-gray-400" />
              </div>
              Analitik & Keuangan lengkap
            </li>
          </ul>

          <hr className="border-gray-100 mb-6" />

          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 font-medium mb-1">Lanjutkan Premium hanya</p>
            <div className="text-3xl font-black text-primary">Rp 99.000 <span className="text-base text-gray-400 font-bold">/ bulan</span></div>
            <p className="text-xs text-green-600 font-bold mt-1 bg-green-50 inline-block px-3 py-1 rounded-full">atau Rp 799.000 / tahun (hemat 33%)</p>
          </div>

          <button 
            onClick={() => {
              onClose();
              navigate('/dashboard/upgrade');
            }}
            className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-black py-4 rounded-full shadow-xl shadow-primary/30 transition-all flex items-center justify-center group mb-4"
          >
            Upgrade ke Premium 
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={onClose}
            className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Lanjut dengan Plan Gratis
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredOverlay;
