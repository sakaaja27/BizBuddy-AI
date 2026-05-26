import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, feature, limit }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const featureNames = {
    'orders': 'Pesanan',
    'products': 'Produk',
    'ai_chat': 'Pesan AI',
    'review_analysis': 'Analisis Review'
  };

  const featureName = featureNames[feature] || 'Fitur';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-slide-up border border-orange-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors z-10"
        >
          <X size={20} />
        </button>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-8 pb-6 text-center border-b border-orange-100/50 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-orange-200/50 rotate-12">
            <Sparkles size={120} />
          </div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-orange-100 relative z-10 text-primary">
            <Sparkles size={32} />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 relative z-10">Limit {featureName} Tercapai</h3>
          <p className="text-gray-600 text-sm leading-relaxed relative z-10">
            Kamu telah mencapai batas <span className="font-bold text-gray-900">{limit} {featureName}</span> untuk plan Gratis.
          </p>
        </div>

        <div className="p-6">
          <p className="text-sm font-bold text-gray-800 mb-4 text-center">Upgrade ke Premium untuk akses Unlimited!</p>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <CheckCircle2 size={16} className="text-primary mr-3 flex-shrink-0" /> 
              <span><span className="font-bold">Unlimited</span> Pesanan & Produk</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <CheckCircle2 size={16} className="text-primary mr-3 flex-shrink-0" /> 
              <span><span className="font-bold">Unlimited</span> AI Chat & Review</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <CheckCircle2 size={16} className="text-primary mr-3 flex-shrink-0" /> 
              <span>Export Laporan & Keuangan</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { onClose(); navigate('/upgrade'); }} 
              className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center"
            >
              <Sparkles size={18} className="mr-2" /> Upgrade Sekarang (Rp 99rb)
            </button>
            <button 
              onClick={onClose} 
              className="w-full bg-white text-gray-500 font-semibold py-2 rounded-xl hover:text-gray-800 transition-colors"
            >
              Mungkin Nanti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
