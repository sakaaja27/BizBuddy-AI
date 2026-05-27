import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Star, Sparkles, MapPin, Link2, Loader2, MessageSquare, 
  TrendingUp, ThumbsUp, ThumbsDown, Copy, Check, Quote, RefreshCw, Bot
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';

const ScrapingView = ({ pageState }) => {
  const isAnalyzingPhase = pageState === 'analyzing';
  
  // Simple cycling messages
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Membaca ulasan satu per satu... 🔍",
    "AI sedang mencari pola keluhan... 🧠",
    "Menghitung sentimen pelanggan... 📊",
    "Hampir selesai, sabar ya! ⏳"
  ];

  useEffect(() => {
    const interval = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 animate-fade-in">
      <div className="bg-white max-w-md w-full p-8 rounded-[32px] shadow-xl border border-gray-100 text-center relative">
        <div className="text-6xl mb-6 animate-bounce">🤖</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Sedang Bekerja...</h2>
        <p className="text-primary font-bold text-sm mb-8 animate-pulse">{messages[msgIdx]}</p>

        <div className="space-y-6 text-left relative before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-gray-100">
          {/* Step 1 */}
          <div className="relative pl-10">
            <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${isAnalyzingPhase ? 'bg-green-500 text-white' : 'bg-primary text-white animate-pulse'}`}>
              {isAnalyzingPhase ? <Check size={14} strokeWidth={4} /> : <Loader2 size={14} className="animate-spin" />}
            </div>
            <h3 className={`font-bold ${isAnalyzingPhase ? 'text-gray-900' : 'text-primary'}`}>🔍 Mengambil Ulasan</h3>
            <p className="text-xs text-gray-500 mt-1">Mengambil data dari Google Maps...</p>
            {!isAnalyzingPhase && (
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="w-2/3 h-full bg-primary rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className="relative pl-10">
            <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${isAnalyzingPhase ? 'bg-primary text-white animate-pulse' : 'bg-gray-200 text-gray-400'}`}>
              {isAnalyzingPhase ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            </div>
            <h3 className={`font-bold ${isAnalyzingPhase ? 'text-primary' : 'text-gray-400'}`}>🧠 Menganalisis dengan AI</h3>
            <p className="text-xs text-gray-500 mt-1">Gemini AI memproses ulasan...</p>
            {isAnalyzingPhase && (
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="w-1/2 h-full bg-primary rounded-full animate-[progress_3s_ease-in-out_infinite]"></div>
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div className="relative pl-10 opacity-50">
            <div className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white bg-gray-200 text-gray-400">
              <Check size={14} />
            </div>
            <h3 className="font-bold text-gray-400">💾 Menyimpan Hasil</h3>
            <p className="text-xs text-gray-500 mt-1">Menunggu...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Reviews = () => {
  const { user } = useAuthStore();
  
  // States: 'idle' (loading init), 'not_connected', 'scraping', 'analyzing', 'done', 'error'
  const [pageState, setPageState] = useState('idle');
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [sentimentFilter, setSentimentFilter] = useState('all');
  
  // Form State
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Draft Reply State
  const [generatingReplyId, setGeneratingReplyId] = useState(null);
  const [copiedDraftId, setCopiedDraftId] = useState(null);
  const [showConfirmRefresh, setShowConfirmRefresh] = useState(false);

  const COLORS = { positive: '#22c55e', neutral: '#94a3b8', negative: '#ef4444' };

  useEffect(() => {
    fetchInitialStatus();
  }, []);

  useEffect(() => {
    let pollInterval;
    if (pageState === 'scraping' || pageState === 'analyzing') {
      pollInterval = setInterval(pollScrapeStatus, 5000);
    }
    return () => clearInterval(pollInterval);
  }, [pageState]);

  useEffect(() => {
    if (pageState === 'done') {
      fetchReviews(1);
    }
  }, [pageState, sentimentFilter]);

  const fetchInitialStatus = async () => {
    try {
      const res = await axios.get('/reviews/analytics');
      if (!res.data.connected) {
        setPageState('not_connected');
      } else {
        const data = res.data.analytics;
        setAnalytics(data);
        if (data.scrapeStatus === 'idle') {
          // Connected but not scraped yet? Or manually reset
          setPageState('not_connected');
        } else {
          setPageState(data.scrapeStatus);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil status');
      setPageState('error');
    }
  };

  const pollScrapeStatus = async () => {
    try {
      const res = await axios.get('/reviews/status');
      const status = res.data.status;
      if (status === 'done') {
        fetchInitialStatus(); // Reload everything
      } else if (status === 'error') {
        setAnalytics(prev => ({ ...prev, errorMessage: res.data.errorMessage }));
        setPageState('error');
      } else {
        setPageState(status);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async (page) => {
    try {
      const res = await axios.get(`/reviews/list?page=${page}&limit=${pagination.limit}&sentiment=${sentimentFilter}`);
      if (page === 1) {
        setReviews(res.data.reviews);
      } else {
        setReviews(prev => [...prev, ...res.data.reviews]);
      }
      setPagination(prev => ({ ...prev, page: res.data.page, total: res.data.total }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!gmapsUrl.trim()) return toast.error('Masukkan link terlebih dahulu');
    
    setIsSubmitting(true);
    try {
      await axios.post('/reviews/connect-gmaps', { googleMapsUrl: gmapsUrl });
      toast.success('Berhasil terhubung!');
      
      // Trigger scrape automatically after connect
      await triggerScrape();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghubungkan URL');
      setIsSubmitting(false);
    }
  };

  const handleRefreshClick = () => {
    if (analytics?.lastScrapedAt) {
      const hoursSince = (Date.now() - new Date(analytics.lastScrapedAt).getTime()) / 3600000;
      if (hoursSince < 1) {
        const minutesLeft = Math.ceil((1 - hoursSince) * 60);
        toast.error(`Tunggu ${minutesLeft} menit lagi sebelum refresh (Cooldown)`);
        return;
      }
    }
    setShowConfirmRefresh(true);
  };

  const triggerScrape = async () => {
    try {
      setShowConfirmRefresh(false);
      setPageState('scraping');
      await axios.post('/reviews/scrape', {});
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal memulai analisis';
      toast.error(msg);
      // Revert if cooldown
      fetchInitialStatus();
    }
  };

  const handleGenerateReply = async (review) => {
    setGeneratingReplyId(review.reviewId);
    try {
      const res = await axios.post('/reviews/generate-reply', {
        reviewId: review.reviewId,
        reviewText: review.reviewText,
        rating: review.rating,
        businessName: user.businessName || 'Bisnis Kami'
      });
      
      // Update local state temporarily to show reply
      setReviews(reviews.map(r => 
        r.reviewId === review.reviewId 
          ? { ...r, aiAnalyzed: true, suggestedReply: res.data.reply } 
          : r
      ));
    } catch (err) {
      toast.error('Gagal membuat draft balasan AI');
    } finally {
      setGeneratingReplyId(null);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftId(id);
    setTimeout(() => setCopiedDraftId(null), 2000);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className={i < Math.round(rating) ? "text-orange-500 fill-orange-500" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  const renderNotConnected = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 animate-fade-in">
      <div className="bg-white max-w-lg w-full p-8 rounded-[32px] shadow-xl border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-primary"></div>
        
        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin size={40} />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 tracking-tight">
          Hubungkan Google Maps
        </h2>
        <p className="text-gray-500 mb-8 font-medium">
          Masukkan link Google Maps tokomu untuk menganalisis ulasan pelanggan secara otomatis dengan AI.
        </p>

        <form onSubmit={handleConnect} className="text-left space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Link Google Maps</label>
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="url"
                value={gmapsUrl}
                onChange={(e) => setGmapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => setShowHelp(!showHelp)}>
              Buka Google Maps → cari tokomu → klik 'Bagikan' → copy link 
              <span className="text-primary font-bold ml-1">{showHelp ? 'Tutup' : 'Lihat Detail'}</span>
            </p>
          </div>

          {showHelp && (
            <div className="bg-orange-50 p-4 rounded-xl text-sm text-orange-800 border border-orange-100 mb-4 animate-slide-up">
              <p className="font-bold mb-2">Cara mendapatkan link Google Maps:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Buka aplikasi Google Maps di HP atau web</li>
                <li>Cari nama toko/bisnis kamu</li>
                <li>Klik tombol <strong>Bagikan (Share)</strong></li>
                <li>Pilih <strong>Salin Tautan (Copy Link)</strong></li>
                <li>Paste di kotak atas 👆</li>
              </ol>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center transition-all disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} className="mr-2" /> Hubungkan & Mulai Analisis</>}
          </button>
        </form>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 animate-fade-in">
      <div className="bg-white max-w-md w-full p-8 rounded-[32px] shadow-xl border border-red-100 text-center">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Gagal Mengambil Data</h2>
        <p className="text-red-500 bg-red-50 p-3 rounded-xl text-sm font-medium mb-6">
          {analytics?.errorMessage || 'Terjadi kesalahan sistem'}
        </p>
        
        <div className="text-left bg-gray-50 p-4 rounded-xl mb-8">
          <p className="text-sm font-bold text-gray-700 mb-2">Kemungkinan Penyebab:</p>
          <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
            <li>Link Google Maps tidak valid / salah ketik</li>
            <li>Toko tidak ditemukan (private/baru)</li>
            <li>Limit kuota Apify/Gemini harian habis</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={triggerScrape}
            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg shadow-primary/20"
          >
            Coba Lagi
          </button>
          <button 
            onClick={() => setPageState('not_connected')}
            className="w-full bg-transparent border border-gray-200 text-gray-600 font-bold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Ganti Link Maps
          </button>
        </div>
      </div>
    </div>
  );

  const renderDone = () => {
    if (!analytics) return null;

    const chartData = [
      { name: 'Positif', value: analytics.sentimentBreakdown.positive.percentage },
      { name: 'Netral', value: analytics.sentimentBreakdown.neutral.percentage },
      { name: 'Negatif', value: analytics.sentimentBreakdown.negative.percentage }
    ];

    const formatTime = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString('id-ID') + ')';
    };

    return (
      <div className="animate-fade-in max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2">
              Review Intelligence <Sparkles size={24} className="text-primary" />
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center text-xs font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                Terhubung ke Maps
              </span>
              <button onClick={() => setPageState('not_connected')} className="text-xs text-gray-400 hover:text-gray-700 underline font-medium">Ganti Link</button>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              Diperbarui: {formatTime(analytics.lastAnalyzedAt)}
            </p>
            <button 
              onClick={handleRefreshClick}
              className="flex items-center justify-center bg-white border border-orange-200 text-primary hover:bg-orange-50 font-bold py-2 px-4 rounded-xl transition-all shadow-sm shadow-orange-100 text-sm"
            >
              <RefreshCw size={16} className="mr-2" /> Refresh Data
            </button>
          </div>
        </div>


        {/* TOP STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Sentimen */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-gray-500 font-bold text-sm mb-4 tracking-wide uppercase">Sentimen Keseluruhan</h3>
            <div className="relative h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.positive : index === 1 ? COLORS.neutral : COLORS.negative} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-gray-900">{analytics.averageRating.toFixed(1)}</span>
                <div className="mt-0.5">{renderStars(Math.round(analytics.averageRating))}</div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center text-xs font-bold text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 shadow-sm"></div>Positif {Math.round(chartData[0].value)}%</div>
              <div className="flex items-center text-xs font-bold text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-2 shadow-sm"></div>Netral {Math.round(chartData[1].value)}%</div>
              <div className="flex items-center text-xs font-bold text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 shadow-sm"></div>Negatif {Math.round(chartData[2].value)}%</div>
            </div>
          </div>

          {/* Card 2: Total Ulasan */}
          <div className="bg-gradient-to-br from-primary to-orange-500 p-8 rounded-3xl shadow-lg shadow-primary/20 text-white relative overflow-hidden flex flex-col justify-center">
            <MessageSquare size={120} className="absolute -right-6 -bottom-6 opacity-10 text-white transform -rotate-12" />
            <h3 className="font-bold text-white/80 text-sm mb-2 tracking-wide uppercase">Ulasan Dianalisis</h3>
            <p className="text-6xl font-black mb-2">{analytics.analyzedCount}</p>
            <p className="text-white/80 font-medium text-sm">dari total {analytics.totalReviews} ulasan di Google Maps</p>
          </div>

          {/* Card 3: Topik Tren */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={20} className="text-primary" />
              <h3 className="text-gray-500 font-bold text-sm tracking-wide uppercase">Topik Sedang Tren 🔥</h3>
            </div>
            <div className="flex flex-wrap gap-2.5 mt-auto mb-auto">
              {analytics.trendingTopics.map((topic, i) => (
                <span key={i} className={`text-sm font-bold px-4 py-2 rounded-xl border ${i===0 ? 'bg-orange-50 text-primary border-orange-200 shadow-sm scale-105 ml-1' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'} transition-all cursor-default`}>
                  #{topic.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI ANALYSIS RESULTS */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Hasil Analisis AI</h2>
              <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">Llama 3.3 (Groq)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Positives */}
            <div className="bg-[#f0fdf4] border border-green-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center mb-5 border-b border-green-200/50 pb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                  <ThumbsUp size={20} />
                </div>
                <h3 className="font-black text-green-800 text-lg">Pelanggan Suka</h3>
              </div>
              <ul className="space-y-4">
                {analytics.topPositives.map((item, idx) => (
                  <li key={idx} className="flex items-start text-sm text-green-900 font-medium leading-relaxed">
                    <span className="mr-3 font-bold text-green-500 bg-white w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm">✓</span> 
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Negatives */}
            <div className="bg-[#fef2f2] border border-red-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center mb-5 border-b border-red-200/50 pb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-3">
                  <ThumbsDown size={20} />
                </div>
                <h3 className="font-black text-red-800 text-lg">Perlu Diperbaiki</h3>
              </div>
              <ul className="space-y-4">
                {analytics.topNegatives.length > 0 ? analytics.topNegatives.map((item, idx) => (
                  <li key={idx} className="flex items-start text-sm text-red-900 font-medium leading-relaxed">
                    <span className="mr-3 font-bold text-red-500 bg-white w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm">⚠</span> 
                    {item}
                  </li>
                )) : <p className="text-gray-500 italic text-sm">Tidak ada keluhan signifikan.</p>}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-[#eff6ff] border border-blue-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center mb-5 border-b border-blue-200/50 pb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-black text-blue-800 text-lg">Rekomendasi Bisnis</h3>
              </div>
              <ul className="space-y-4">
                {analytics.recommendations.map((item, idx) => (
                  <li key={idx} className="flex items-start text-sm text-blue-900 font-medium leading-relaxed">
                    <span className="mr-3 font-bold text-blue-500 bg-white w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm">→</span> 
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gray-50/80 border border-gray-100 rounded-3xl p-6 text-center relative overflow-hidden">
            <Quote size={40} className="absolute -top-2 -left-2 text-gray-200 transform -scale-x-100" />
            <p className="text-gray-600 font-medium italic relative z-10 max-w-3xl mx-auto leading-relaxed text-sm md:text-base">
              {analytics.overallSummary}
            </p>
          </div>
        </div>

        {/* ULASAN TERBARU */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-black text-gray-900">Daftar Ulasan Asli</h2>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'positive', label: '😊 Positif' },
                { id: 'neutral', label: '😐 Netral' },
                { id: 'negative', label: '😞 Negatif' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => { setSentimentFilter(f.id); setPagination(prev => ({...prev, page: 1})); }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${sentimentFilter === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {reviews.map((review) => (
              <div key={review.reviewId} className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    {review.reviewerAvatar ? (
                      <img src={review.reviewerAvatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-black text-lg border border-gray-200">
                        {review.reviewerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm md:text-base">{review.reviewerName}</h4>
                        {review.isLocalGuide && <span className="text-[9px] font-black bg-orange-100 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Local Guide</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Google Maps
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(review.reviewDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                    ${review.sentiment === 'positive' ? 'bg-green-50 text-green-600 border-green-200' : 
                      review.sentiment === 'negative' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {review.sentiment === 'positive' ? 'POSITIF' : review.sentiment === 'negative' ? 'NEGATIF' : 'NETRAL'}
                  </div>
                </div>

                <div className="mb-3">
                  {renderStars(review.rating)}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {review.reviewText || <span className="text-gray-400 italic">Pengguna tidak menuliskan teks ulasan.</span>}
                </p>

                {/* Owner Reply */}
                {review.ownerReply && (
                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 ml-0 md:ml-12 relative">
                    <div className="absolute -left-2 top-6 w-4 h-px bg-gray-300 hidden md:block"></div>
                    <div className="absolute -left-2 top-0 bottom-0 w-px bg-gray-300 hidden md:block"></div>
                    
                    <span className="inline-block bg-gray-200 text-gray-700 text-[10px] font-black uppercase px-2 py-1 rounded-md mb-2">
                      Balasan Pemilik
                    </span>
                    <p className="text-sm text-gray-600 italic">"{review.ownerReply}"</p>
                  </div>
                )}

                {/* AI Draft Reply for Negative/Neutral without existing reply */}
                {!review.ownerReply && review.reviewText && (review.sentiment === 'negative' || review.sentiment === 'neutral') && (
                  <div className="mt-4 ml-0 md:ml-12">
                    {!review.aiAnalyzed ? (
                      <button 
                        onClick={() => handleGenerateReply(review)}
                        disabled={generatingReplyId === review.reviewId}
                        className="text-xs font-bold text-primary bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors flex items-center border border-orange-100 disabled:opacity-50"
                      >
                        {generatingReplyId === review.reviewId ? <Loader2 size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-2" />}
                        {generatingReplyId === review.reviewId ? 'Meracik kata-kata...' : '✨ Buat Balasan AI'}
                      </button>
                    ) : (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Bot size={16} className="text-blue-600" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Draft Balasan AI</span>
                          </div>
                          <button 
                            onClick={() => handleCopy(review.reviewId, review.suggestedReply)}
                            className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center shadow-sm"
                          >
                            {copiedDraftId === review.reviewId ? <><Check size={12} className="mr-1"/> Disalin</> : <><Copy size={12} className="mr-1"/> Salin Draft</>}
                          </button>
                        </div>
                        <p className="text-sm text-blue-900/80 italic bg-white/60 p-3 rounded-xl border border-white">
                          "{review.suggestedReply}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">Tidak ada ulasan dengan sentimen {sentimentFilter}</p>
              </div>
            )}
          </div>

          {reviews.length < pagination.total && (
            <div className="text-center mb-8">
              <button 
                onClick={() => fetchReviews(pagination.page + 1)}
                className="bg-white border-2 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 font-bold py-3 px-8 rounded-full transition-all text-sm"
              >
                Muat Lebih Banyak...
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <DashboardLayout>
        <div className="p-4 md:p-8 min-h-screen bg-[#FAFAFA]">
          {pageState === 'idle' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="animate-spin text-primary w-12 h-12" />
            </div>
          )}
          {pageState === 'not_connected' && renderNotConnected()}
          {(pageState === 'scraping' || pageState === 'analyzing') && <ScrapingView pageState={pageState} />}
          {pageState === 'error' && renderError()}
          {pageState === 'done' && renderDone()}
        </div>
      </DashboardLayout>

      {/* Confirm Refresh Modal (Full Screen) */}
      {showConfirmRefresh && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-black text-gray-900 mb-2">Perbarui Data?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Proses ini akan mengambil ulang 200 ulasan terbaru dari Google Maps dan menganalisis ulang dengan AI. Estimasi waktu: 2-5 menit.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmRefresh(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Batal</button>
              <button onClick={triggerScrape} className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl shadow-md shadow-primary/20">Ya, Perbarui</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Reviews;
