import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import PeriodFilter from '../components/shared/PeriodFilter';
import { Download, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Calendar, FileText, ChevronDown, Plus } from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

const formatRp = (num) => {
  if (Math.abs(num) >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `Rp ${(num / 1000).toFixed(0)}K`;
  return `Rp ${num}`;
};

const Finance = () => {
  const [periodConfig, setPeriodConfig] = useState({ period: 'Bulan Ini', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  
  const [summary, setSummary] = useState(null);
  const [cashflow, setCashflow] = useState([]);
  const [transactions, setTransactions] = useState({ data: [], totalPages: 1, currentPage: 1 });
  const [txFilter, setTxFilter] = useState('all');
  const [productBreakdown, setProductBreakdown] = useState([]);
  const [breakdownType, setBreakdownType] = useState('revenue');

  const [expenseForm, setExpenseForm] = useState({ description: '', category: 'operasional', amount: '', date: new Date().toISOString().split('T')[0] });
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [periodConfig, txFilter, transactions.currentPage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: periodConfig.period,
        ...(periodConfig.from && { from: periodConfig.from }),
        ...(periodConfig.to && { to: periodConfig.to }),
      });

      const txParams = new URLSearchParams(params);
      txParams.append('type', txFilter);
      txParams.append('page', transactions.currentPage);
      txParams.append('limit', 10);

      const [sumRes, cfRes, txRes, pbRes] = await Promise.all([
        axios.get(`/finance/summary?${params.toString()}`),
        axios.get(`/finance/cashflow?${params.toString()}`),
        axios.get(`/finance/transactions?${txParams.toString()}`),
        axios.get(`/finance/product-breakdown?${params.toString()}`)
      ]);

      setSummary(sumRes.data);
      setCashflow(cfRes.data);
      setTransactions(txRes.data);
      setProductBreakdown(pbRes.data);
    } catch (error) {
      console.error('Failed to fetch finance data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;
    try {
      await axios.post('/finance/expenses', {
        ...expenseForm,
        amount: Number(expenseForm.amount)
      });
      setExpenseForm({ description: '', category: 'operasional', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
      alert('Pengeluaran berhasil dicatat!');
    } catch (error) {
      console.error(error);
      alert('Gagal mencatat pengeluaran');
    }
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams({
      period: periodConfig.period,
      ...(periodConfig.from && { from: periodConfig.from }),
      ...(periodConfig.to && { to: periodConfig.to }),
    }).toString();
    window.location.href = `http://localhost:5000/api/finance/export/excel?${params}`;
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    setIsExportMenuOpen(false);
    const element = pdfRef.current;
    if (!element) return;
    
    const opt = {
      margin:       10,
      filename:     `Laporan-Keuangan-${periodConfig.period.replace(/\s+/g, '-')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <DashboardLayout>
      <div ref={pdfRef} className="bg-[#FAFAFA] min-h-screen">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 px-1 py-1">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Laporan Keuangan</h1>
            <p className="text-gray-500 mt-1">Kelola arus kas dan profitabilitas bisnis</p>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <PeriodFilter 
              selectedPeriod={periodConfig.period} 
              onPeriodChange={(config) => { setPeriodConfig(config); setTransactions({ ...transactions, currentPage: 1 }); }}
              disabled={loading}
            />
            
            <div className="relative" ref={exportMenuRef}>
              <button 
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
              >
                <Download size={18} className="mr-2" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown size={16} className="ml-1" />
              </button>
              
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-semibold flex items-center border-b border-gray-50 text-gray-700">
                    📄 Export PDF
                  </button>
                  <button onClick={handleExportExcel} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-semibold flex items-center text-gray-700">
                    📊 Export Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && !summary ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 border-t-4 border-t-green-500">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Pemasukan</p>
                  <ArrowUpCircle size={24} className="text-green-500" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-1">Rp {summary?.totalPemasukan?.toLocaleString()}</h3>
                <p className="text-sm font-semibold text-gray-400">{summary?.transaksiBerhasil} transaksi berhasil</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 border-t-4 border-t-red-500">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Pengeluaran</p>
                  <ArrowDownCircle size={24} className="text-red-500" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-1">Rp {summary?.totalPengeluaran?.toLocaleString()}</h3>
                <p className="text-sm font-semibold text-gray-400">Termasuk {summary?.restockCount} kali restock stok</p>
              </div>

              <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 border-t-4 ${summary?.labaBersih >= 0 ? 'border-t-green-500' : 'border-t-red-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Laba Bersih</p>
                  {summary?.labaBersih >= 0 ? <TrendingUp size={24} className="text-green-500" /> : <TrendingDown size={24} className="text-red-500" />}
                </div>
                <h3 className={`text-3xl font-black mb-1 ${summary?.labaBersih >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  Rp {summary?.labaBersih?.toLocaleString()}
                </h3>
                <p className="text-sm font-semibold text-gray-400">
                  {summary?.labaBersih >= 0 ? `Margin ${summary?.margin}%` : 'Rugi'}
                </p>
              </div>
            </div>

            {/* Cashflow Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Arus Kas ({periodConfig.period})</h3>
              {cashflow.length === 0 ? <EmptyState /> : (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={cashflow} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="#f5f5f5" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 12}} />
                      <YAxis tickFormatter={formatRp} tick={{fontSize: 12}} />
                      <RechartsTooltip formatter={(value) => `Rp ${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="pemasukan" name="Pemasukan" barSize={20} fill="#2ECC71" radius={[4,4,0,0]} />
                      <Bar dataKey="pengeluaran" name="Pengeluaran" barSize={20} fill="#E74C3C" radius={[4,4,0,0]} />
                      <Line type="monotone" dataKey="labaBersih" name="Laba Bersih" stroke="#1E3A8A" strokeWidth={3} dot={{r: 4}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 2 Columns: Table & Product Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
              
              {/* Transactions Table */}
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
                  <h3 className="font-bold text-gray-900 text-lg">Riwayat Transaksi</h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['all', 'pemasukan', 'pengeluaran'].map(t => (
                      <button 
                        key={t}
                        onClick={() => { setTxFilter(t); setTransactions({...transactions, currentPage: 1}); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize ${txFilter === t ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                      >
                        {t === 'all' ? 'Semua' : t}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 overflow-x-auto p-4">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">Tanggal</th>
                        <th className="px-4 py-3">Keterangan</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3 text-right rounded-r-xl">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.data.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-500">Belum ada transaksi tercatat</td></tr>
                      ) : (
                        transactions.data.map(tx => (
                          <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-gray-500">{new Date(tx.tanggal).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{tx.keterangan}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${tx.tipe === 'pemasukan' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {tx.kategori}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-right font-bold ${tx.tipe === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.tipe === 'pemasukan' ? '+' : '-'} Rp {tx.jumlah.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {transactions.totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                    <button 
                      disabled={transactions.currentPage === 1}
                      onClick={() => setTransactions({...transactions, currentPage: transactions.currentPage - 1})}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded disabled:opacity-50 font-semibold hover:bg-gray-200"
                    >
                      Prev
                    </button>
                    <span className="text-sm font-semibold text-gray-500">Hal {transactions.currentPage} dari {transactions.totalPages}</span>
                    <button 
                      disabled={transactions.currentPage === transactions.totalPages}
                      onClick={() => setTransactions({...transactions, currentPage: transactions.currentPage + 1})}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded disabled:opacity-50 font-semibold hover:bg-gray-200"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Product Contribution */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 text-lg">Kontribusi Produk</h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => setBreakdownType('revenue')} className={`px-2 py-1 text-xs font-bold rounded-md ${breakdownType === 'revenue' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Revenue</button>
                      <button onClick={() => setBreakdownType('profit')} className={`px-2 py-1 text-xs font-bold rounded-md ${breakdownType === 'profit' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Profit</button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {productBreakdown.length === 0 ? <p className="text-center text-gray-500 py-4">Tidak ada data penjualan</p> : (
                      productBreakdown.sort((a,b) => b[breakdownType] - a[breakdownType]).map((p) => (
                        <div key={p.productName}>
                          <div className="flex justify-between text-sm font-semibold mb-1">
                            <span className="text-gray-800">{p.productName}</span>
                            <span className={breakdownType === 'revenue' ? 'text-orange-600' : 'text-green-600'}>
                              Rp {p[breakdownType].toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${breakdownType === 'revenue' ? 'bg-orange-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.max(5, (p[breakdownType] / productBreakdown[0][breakdownType]) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex justify-between">
                            <span>{p.terjual} terjual</span>
                            <span>Margin {p.margin.toFixed(0)}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Tax Estimation */}
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">Estimasi Pajak (PPh Final UMKM 0.5%)</h3>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-500 text-sm font-semibold">Omset (Revenue)</span>
                    <span className="font-bold text-gray-900">Rp {summary?.totalPemasukan?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-gray-200 mt-2">
                    <span className="text-gray-700 font-bold">Estimasi Pajak</span>
                    <span className="text-xl font-black text-red-600">Rp {((summary?.totalPemasukan || 0) * 0.005).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-4 leading-tight">
                    *Hanya estimasi berdasarkan PP No 23 Tahun 2018 (0.5% dari peredaran bruto). Konsultasikan dengan konsultan pajak Anda untuk angka pasti.
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Expense Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 border-l-4 border-l-primary">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Catat Pengeluaran Lain</h3>
              <form onSubmit={handleAddExpense} className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Keterangan</label>
                  <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="Cth: Bayar Listrik Bulan Ini" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-primary text-sm" required />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-primary text-sm">
                    <option value="operasional">Operasional</option>
                    <option value="gaji">Gaji</option>
                    <option value="marketing">Marketing</option>
                    <option value="peralatan">Peralatan</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="w-48">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Jumlah (Rp)</label>
                  <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="500000" min="0" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-primary text-sm" required />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-primary text-sm" required />
                </div>
                <button type="submit" className="bg-primary text-white font-bold py-2 px-6 rounded-xl hover:bg-orange-600 transition-colors flex items-center h-10 shadow-md shadow-primary/20">
                  <Plus size={18} className="mr-2" /> Tambah
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <FileText size={48} className="text-gray-300 mb-4" />
    <p className="text-gray-500 font-medium mb-1">Belum ada transaksi tercatat</p>
    <p className="text-sm text-gray-400">Pilih periode lain atau mulai dengan mencatat pesanan pertama</p>
  </div>
);

export default Finance;
