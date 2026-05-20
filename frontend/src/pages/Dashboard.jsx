import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, ShoppingBag, Banknote, AlertTriangle, Star } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import AiReportCard from '../components/dashboard/AiReportCard';
import StockStatusCard from '../components/dashboard/StockStatusCard';
import RecentOrdersTable from '../components/dashboard/RecentOrdersTable';
import SentimentChart from '../components/dashboard/SentimentChart';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update page title
    document.title = "Dashboard — BizBuddy AI";

    const fetchDashboardData = async () => {
      try {
        const res = await axios.get('/dashboard/stats');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format today's date
  const todayDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const getFirstName = (name) => {
    return name ? name.split(' ')[0] : 'User';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // Handle Empty State if needed
  if (!data || (!data.stats.totalOrders && data.stats.lowStockCount === 0 && data.recentOrders.length === 0)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
          <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-6xl">🚀</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang di BizBuddy AI!</h2>
          <p className="text-gray-500 max-w-md mb-8">Dashboard Anda masih kosong. Mari mulai dengan menambahkan produk pertama Anda untuk melihat analitik cerdas kami bekerja.</p>
          <button className="bg-primary hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary/30">
            Tambah Data Pertama Kamu
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, aiReport, stockStatus, recentOrders, sentiment } = data;

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
              Selamat Datang, {getFirstName(user?.name)} 👋
            </h1>
            <p className="text-gray-500 font-medium">Berikut adalah ringkasan bisnis Anda hari ini.</p>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm shadow-gray-100/50">
            <Calendar size={18} className="text-primary mr-2" />
            <span className="text-sm font-bold text-gray-700">{todayDate}</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            label="Total Pesanan"
            value={stats.totalOrders}
            icon={ShoppingBag}
            trend="up"
            trendValue="+12% vs kemarin"
            iconColorClass="text-primary"
            iconBgClass="bg-orange-100"
            borderClass="border-t-primary"
          />
          <StatCard 
            label="Pendapatan Hari Ini"
            value={`Rp ${stats.revenueToday > 1000000 ? (stats.revenueToday / 1000000).toFixed(1) + 'M' : stats.revenueToday.toLocaleString('id-ID')}`}
            icon={Banknote}
            trend="up"
            trendValue="+8.5% vs kemarin"
            iconColorClass="text-secondary"
            iconBgClass="bg-blue-100"
            borderClass="border-t-secondary"
          />
          <StatCard 
            label="Stok Menipis"
            value={stats.lowStockCount}
            icon={AlertTriangle}
            trend="down"
            trendValue="Butuh perhatian segera"
            iconColorClass="text-red-600"
            iconBgClass="bg-red-100"
            borderClass="border-red-300 border-2"
            alert={true}
          />
          <StatCard 
            label="Rata-rata Ulasan"
            value={`${stats.averageReview} / 5.0`}
            icon={Star}
            trend="up"
            trendValue={`Sangat Baik (${stats.totalReviews} ulasan baru)`}
            iconColorClass="text-yellow-500"
            iconBgClass="bg-yellow-100"
            borderClass="border-t-yellow-400"
          />
        </div>

        {/* Middle Section: AI Report & Stock Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AiReportCard report={aiReport} />
          </div>
          <div className="lg:col-span-1">
            <StockStatusCard stockData={stockStatus} />
          </div>
        </div>

        {/* Bottom Section: Orders Table & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrdersTable orders={recentOrders} />
          </div>
          <div className="lg:col-span-1">
            <SentimentChart data={sentiment} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
