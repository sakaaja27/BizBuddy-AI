import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Custom CountUp hook to avoid third-party ESM issues
const useCountUp = (end, duration = 1500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
};

const StatCard = ({ label, value, icon: Icon, trend, trendValue, iconColorClass, iconBgClass, borderClass, alert = false }) => {
  // Extract number for animation if it's purely numeric, else keep as string (e.g. "Rp 3.2M", "4.8 / 5.0")
  const numericValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
  const isNumericOnly = !isNaN(numericValue) && value.toString() === numericValue.toString();
  
  const animatedValue = useCountUp(isNumericOnly ? numericValue : 0);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${borderClass} overflow-hidden flex flex-col relative transition-all duration-300 hover:shadow-md ${alert ? 'bg-red-50/30' : ''}`}>
      {/* Top Border Accent */}
      {borderClass.includes('border-t-') && (
        <div className={`absolute top-0 left-0 w-full h-1 ${borderClass.split(' ')[0].replace('border-t', 'bg')}`}></div>
      )}

      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <p className={`text-xs font-bold uppercase tracking-wider text-gray-500`}>
            {label}
          </p>
          <div className={`p-2 rounded-xl ${iconBgClass}`}>
            <Icon size={20} className={iconColorClass} />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <h3 className={`text-3xl font-extrabold tracking-tight text-gray-900`}>
            {isNumericOnly ? (
              new Intl.NumberFormat('id-ID').format(animatedValue)
            ) : (
              value
            )}
          </h3>
        </div>
      </div>

      <div className={`px-5 py-3 border-t ${alert ? 'border-red-100 bg-red-50/50' : 'border-gray-50 bg-gray-50/50'}`}>
        <div className="flex items-center">
          {trend === 'up' && <ArrowUpRight size={16} className="text-green-500 mr-1" />}
          {trend === 'down' && <ArrowDownRight size={16} className="text-red-500 mr-1" />}
          <span className={`text-xs font-medium ${alert ? 'text-red-600' : trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
            {trendValue}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
