import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const SentimentChart = ({ data }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data) return null;

  const chartData = [
    { name: 'Positif (Puas)', value: data.positive || 0, color: '#FF6B35' },
    { name: 'Netral (Biasa)', value: data.neutral || 0, color: '#A8B3CF' },
    { name: 'Saran (Perlu Peningkatan)', value: data.negative || 0, color: '#FFB347' },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-gray-900">Sentimen Ulasan</h3>
      </div>
      
      <div className="flex-1 relative min-h-[200px] flex items-center justify-center">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `${value}%`}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-extrabold text-gray-900">{data.positive || 0}%</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Positif</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentimentChart;
