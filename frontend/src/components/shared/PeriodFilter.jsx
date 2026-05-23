import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

const PERIODS = ['Hari Ini', 'Minggu Ini', 'Bulan Ini', '3 Bulan', 'Tahun Ini', 'Custom'];

const PeriodFilter = ({ selectedPeriod, onPeriodChange, disabled }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  const handlePeriodClick = (p) => {
    if (disabled) return;
    if (p === 'Custom') {
      setShowCustom(!showCustom);
    } else {
      setShowCustom(false);
      onPeriodChange({ period: p });
    }
  };

  const applyCustomRange = () => {
    if (!customRange.from || !customRange.to) return;
    onPeriodChange({ period: 'Custom', from: customRange.from, to: customRange.to });
    setShowCustom(false);
  };

  return (
    <div className="relative flex flex-col sm:flex-row items-end sm:items-center gap-3">
      {/* Pills */}
      <div className={`flex bg-gray-100 p-1 rounded-xl overflow-x-auto max-w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => handlePeriodClick(p)}
            className={`whitespace-nowrap px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
              selectedPeriod === p 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Custom Date Picker Popup */}
      {showCustom && (
        <div className="absolute top-full mt-2 right-0 bg-white shadow-xl border border-gray-100 rounded-2xl p-4 z-50 flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-center text-gray-700 font-bold mb-2">
            <Calendar size={18} className="mr-2 text-primary" />
            Pilih Rentang Tanggal
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-semibold">Dari</label>
            <input 
              type="date" 
              value={customRange.from}
              onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-semibold">Sampai</label>
            <input 
              type="date" 
              value={customRange.to}
              onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <button 
            onClick={applyCustomRange}
            disabled={!customRange.from || !customRange.to}
            className="w-full mt-2 bg-primary text-white font-bold py-2 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Terapkan
          </button>
        </div>
      )}
    </div>
  );
};

export default PeriodFilter;
