import React from 'react';

const StockStatusCard = ({ stockData }) => {
  if (!stockData || stockData.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Status Stok Utama</h3>
      </div>

      <div className="space-y-5 flex-1">
        {stockData.map((item, index) => {
          // Logic for progress bar and badge
          let statusBadge = '';
          let badgeClass = '';
          let progressColor = '';
          let progressPercent = 0;
          let isCritical = false;

          if (item.stock > 20) {
            statusBadge = 'Aman';
            badgeClass = 'bg-green-100 text-green-700';
            progressColor = 'bg-primary';
            progressPercent = Math.min(item.stock, 100);
          } else if (item.stock > 10) {
            statusBadge = 'Aman';
            badgeClass = 'bg-green-100 text-green-700';
            progressColor = 'bg-accent';
            progressPercent = Math.max(item.stock * 2, 40);
          } else if (item.stock > 5) {
            statusBadge = 'Warning';
            badgeClass = 'bg-orange-100 text-orange-700';
            progressColor = 'bg-orange-500';
            progressPercent = Math.max(item.stock * 3, 20);
          } else {
            statusBadge = 'Kritis';
            badgeClass = 'bg-red-100 text-red-700';
            progressColor = 'bg-red-500';
            progressPercent = Math.max(item.stock * 5, 5);
            isCritical = true;
          }

          return (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-semibold ${isCritical ? 'text-red-600' : 'text-gray-700'}`}>
                  {item.name} - {item.stock} {item.category === 'Minuman' && item.stock < 100 ? 'Liter' : 'pcs'}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}>
                  {statusBadge}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ease-out ${progressColor}`} 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-6 w-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all">
        Kelola Inventaris
      </button>
    </div>
  );
};

export default StockStatusCard;
