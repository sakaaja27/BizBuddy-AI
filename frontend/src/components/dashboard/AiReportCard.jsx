import React, { useState } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

const AiReportCard = ({ report }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!report) return null;

  // Simple parser to make [bold]text[/bold] bold
  const parseBody = (text) => {
    const parts = text.split(/\[bold\](.*?)\[\/bold\]/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="text-gray-900 font-bold">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl shadow-sm border border-orange-100 p-6 flex flex-col md:flex-row gap-5 transition-all duration-300 hover:shadow-md h-80">
        <div className="flex-shrink-0 hidden md:block">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 relative">
            <span className="text-2xl animate-pulse">🤖</span>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
              <Sparkles size={14} className="text-accent" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 md:hidden">
              <span className="text-xl animate-pulse">🤖</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
            <span className="bg-orange-100 text-orange-600 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">BETA</span>
          </div>
          
          <div className="flex-1">
            <p className="text-gray-600 leading-relaxed text-md line-clamp-4">
              {parseBody(report.body)}
            </p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 flex items-center text-primary font-bold text-sm hover:text-orange-600 transition-colors group w-max"
          >
            Lihat Analisis Lengkap 
            <ArrowRight size={16} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Modal Penjelasan Lengkap */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-sm">🤖</span>
                </div>
                <h3 className="font-bold text-gray-900">Analisis AI Lengkap</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                {parseBody(report.body)}
              </p>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm shadow-md shadow-primary/20"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiReportCard;
