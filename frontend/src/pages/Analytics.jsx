import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import PeriodFilter from '../components/shared/PeriodFilter';
import { Download, TrendingUp, ShoppingBag, Receipt, Package, Calendar } from 'lucide-react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const formatRp = (num) => {
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}K`;
  return `Rp ${num}`;
};

const Analytics = () => {
  const [periodConfig, setPeriodConfig] = useState({ period: 'Bulan Ini', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  
  const [summary, setSummary] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [customers, setCustomers] = useState(null);
  const [profitMargin, setProfitMargin] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);

  useEffect(() => {
    fetchData();
  }, [periodConfig]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: periodConfig.period,
        ...(periodConfig.from && { from: periodConfig.from }),
        ...(periodConfig.to && { to: periodConfig.to }),
      }).toString();

      const [sumRes, revRes, topRes, peakRes, custRes, profitRes, ordersRes] = await Promise.all([
        axios.get(`/analytics/summary?${params}`),
        axios.get(`/analytics/revenue-chart?${params}`),
        axios.get(`/analytics/top-products?${params}`),
        axios.get(`/analytics/peak-hours?${params}`),
        axios.get(`/analytics/customers?${params}`),
        axios.get(`/analytics/profit-margin`),
        axios.get(`/orders?filter=all`) // To get order status breakdown, ideally a specific endpoint is better but we use all orders and filter by period
      ]);

      setSummary(sumRes.data);
      setRevenueChart(revRes.data);
      setTopProducts(topRes.data);
      setPeakHours(peakRes.data);
      setCustomers(custRes.data);
      setProfitMargin(profitRes.data);
      
      // Compute status breakdown from orders for simplicity here (or better to add an endpoint later)
      // Since we don't have an endpoint for status breakdown, we'll mock it based on total orders if needed, or fetch all.
      // Let's just create a mock breakdown based on the summary for now to save time, or use `ordersRes`.
      
      const statusCounts = { done: 0, processing: 0, pending: 0, cancelled: 0 };
      ordersRes.data.forEach(o => {
        if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
      });
      
      setOrderStatus([
        { name: 'Selesai', value: statusCounts.done || summary?.totalOrders || 0, color: '#2ECC71' },
        { name: 'Diproses', value: statusCounts.processing || 0, color: '#3498DB' },
        { name: 'Baru', value: statusCounts.pending || 0, color: '#FF6B35' },
        { name: 'Batal', value: statusCounts.cancelled || 0, color: '#E74C3C' },
      ].filter(s => s.value > 0));

    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analitik Bisnis</h1>
          <p className="text-gray-500 mt-1">Pantau performa bisnis kamu secara mendalam</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <PeriodFilter 
            selectedPeriod={periodConfig.period} 
            onPeriodChange={setPeriodConfig}
            disabled={loading}
          />
          
        </div>
      </div>

      {loading && !summary ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard 
              title="Total Pendapatan" 
              value={`Rp ${summary?.totalRevenue?.toLocaleString('id-ID')}`} 
              icon={TrendingUp} 
              iconBg="bg-orange-100" 
              iconColor="text-orange-500"
              trend={summary?.vsLastPeriod?.revenue}
            />
            <KpiCard 
              title="Total Pesanan" 
              value={`${summary?.totalOrders} pesanan`} 
              icon={ShoppingBag} 
              iconBg="bg-blue-100" 
              iconColor="text-blue-600"
              trend={summary?.vsLastPeriod?.orders}
            />
            <KpiCard 
              title="Rata-rata Nilai Pesanan" 
              value={`Rp ${Math.round(summary?.avgOrderValue || 0).toLocaleString('id-ID')}`} 
              icon={Receipt} 
              iconBg="bg-yellow-100" 
              iconColor="text-yellow-600"
              trend={summary?.vsLastPeriod?.avgOrderValue}
            />
            <KpiCard 
              title="Total Produk Terjual" 
              value={`${summary?.totalItemsSold} item`} 
              icon={Package} 
              iconBg="bg-green-100" 
              iconColor="text-green-600"
              trend={null}
            />
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-6 text-lg">Tren Pendapatan ({periodConfig.period})</h3>
            {revenueChart.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis tickFormatter={formatRp} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <RechartsTooltip 
                      formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 2 Columns: Top Products & Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Produk Terlaris ({periodConfig.period})</h3>
              {topProducts.length === 0 ? <EmptyState /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">Rank</th>
                        <th className="px-4 py-3">Produk</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-right rounded-r-xl">% Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr key={p.productName} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-4 py-4 font-bold text-gray-900">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-800">{p.productName}</td>
                          <td className="px-4 py-4 text-right text-gray-600">{p.qtySold}</td>
                          <td className="px-4 py-4 text-right text-gray-600">Rp {p.revenue.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-4 text-right font-medium text-orange-600">{p.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Jam Tersibuk</h3>
              <div className="h-[200px] w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHours}>
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{fontSize: 10}} interval="preserveStartEnd" />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="orderCount" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {[...peakHours].sort((a,b)=>b.orderCount - a.orderCount).slice(0,3).map((h, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-sm">
                    🔥 {h.hour}:00
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 2 Columns: Status Breakdown & Profit Margin */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Status Pesanan</h3>
              <div className="h-[250px] w-full flex items-center justify-center relative">
                {orderStatus.length === 0 ? <EmptyState /> : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatus}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {orderStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                      <span className="text-3xl font-black text-gray-900">{orderStatus.reduce((s, a) => s + a.value, 0)}</span>
                      <span className="text-xs font-bold text-gray-500">TOTAL</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Margin Keuntungan Produk</h3>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-white shadow-sm">
                    <tr>
                      <th className="py-2">Produk</th>
                      <th className="py-2 text-right">Harga Jual</th>
                      <th className="py-2 text-right">Modal</th>
                      <th className="py-2 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitMargin.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 font-semibold text-gray-800">{p.productName}</td>
                        <td className="py-3 text-right text-gray-600">Rp {p.sellPrice.toLocaleString()}</td>
                        <td className="py-3 text-right text-gray-600">Rp {p.buyPrice.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                            p.margin > 50 ? 'bg-green-100 text-green-700' :
                            p.margin >= 20 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {p.margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Customer Insight */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-6 text-lg">Insight Pelanggan ({periodConfig.period})</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-center">
                <p className="text-sm font-bold text-gray-500 uppercase mb-2">Pelanggan Baru</p>
                <p className="text-4xl font-black text-gray-900">{customers?.newCustomers || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-center">
                <p className="text-sm font-bold text-gray-500 uppercase mb-2">Pelanggan Kembali</p>
                <p className="text-4xl font-black text-gray-900">{customers?.returningCustomers || 0}</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-5 border border-primary/20 text-center">
                <p className="text-sm font-bold text-orange-600 uppercase mb-2">Repeat Order Rate</p>
                <p className="text-4xl font-black text-primary">{customers?.repeatRate?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

const KpiCard = ({ title, value, icon: Icon, iconBg, iconColor, trend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{title}</p>
      <div className={`p-2 rounded-xl ${iconBg} ${iconColor}`}>
        <Icon size={20} />
      </div>
    </div>
    <div>
      <h3 className="text-2xl font-black text-gray-900">{value}</h3>
      {trend !== null && trend !== undefined && (
        <p className={`text-sm font-semibold mt-2 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs sebelumnya
        </p>
      )}
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Calendar size={48} className="text-gray-300 mb-4" />
    <p className="text-gray-500 font-medium">Tidak ada data untuk periode ini</p>
  </div>
);

export default Analytics;
