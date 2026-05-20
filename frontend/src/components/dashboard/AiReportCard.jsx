import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const AiReportCard = ({ report }) => {
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
    <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl shadow-sm border border-orange-100 p-6 flex flex-col md:flex-row gap-5 transition-all duration-300 hover:shadow-md">
      <div className="flex-shrink-0 hidden md:block">
        <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 relative">
          <span className="text-2xl animate-pulse">🤖</span>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
            <Sparkles size={14} className="text-accent" />
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 md:hidden">
            <span className="text-xl animate-pulse">🤖</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
          <span className="bg-orange-100 text-orange-600 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">BETA</span>
        </div>
        
        <p className="text-gray-600 leading-relaxed text-sm">
          {parseBody(report.body)}
        </p>

        <button className="mt-4 flex items-center text-primary font-bold text-sm hover:text-orange-600 transition-colors group">
          Lihat Analisis Lengkap 
          <ArrowRight size={16} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default AiReportCard;
