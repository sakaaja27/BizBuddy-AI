import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Star, Sparkles, Download, MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, Copy, Check, Loader2, Bot } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Reviews = () => {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // AI Analyzer State
  const [analyzeText, setAnalyzeText] = useState('');
  const [selectedSources, setSelectedSources] = useState(['Google', 'GoFood']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [copiedDraftId, setCopiedDraftId] = useState(null);

  const sources = ['Tokopedia', 'Shopee', 'Google', 'GoFood', 'Manual'];
  const COLORS = ['#FF6B35', '#A8B3CF', '#FFB347']; // Positif(orange), Netral(gray), Negatif(gold/light orange)

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, reviewsRes] = await Promise.all([
        axios.get('/reviews/stats'),
        axios.get('/reviews?limit=10')
      ]);
      setStats(statsRes.data);
      setReviews(reviewsRes.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Gagal memuat data ulasan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceToggle = (src) => {
    if (selectedSources.includes(src)) {
      setSelectedSources(selectedSources.filter(s => s !== src));
    } else {
      setSelectedSources([...selectedSources, src]);
    }
  };

  const handleAnalyze = async () => {
    if (!analyzeText.trim()) {
      toast.error('Masukkan teks ulasan terlebih dahulu');
      return;
    }
    if (selectedSources.length === 0) {
      toast.error('Pilih minimal satu sumber');
      return;
    }

    setIsAnalyzing(true);
    setAiResult(null);
    try {
      const { data } = await axios.post('/reviews/analyze', {
        reviewsText: analyzeText,
        source: selectedSources
      });
      setAiResult(data);
      toast.success('Analisis selesai!');
    } catch (error) {
      console.error('AI Analyze error:', error);
      toast.error('Gagal melakukan analisis AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyDraft = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftId(id);
    setTimeout(() => setCopiedDraftId(null), 2000);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} className={i < rating ? "text-orange-500 fill-orange-500" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  const getPlatformColor = (platform) => {
    switch(platform?.toLowerCase()) {
      case 'tokopedia': return 'bg-green-100 text-green-700';
      case 'shopee': return 'bg-orange-100 text-orange-700';
      case 'google': return 'bg-blue-100 text-blue-700';
      case 'gofood': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const chartData = stats ? [
    { name: 'Positif', value: stats.sentimentPercentage.positive },
    { name: 'Netral', value: stats.sentimentPercentage.neutral },
    { name: 'Negatif', value: stats.sentimentPercentage.negative }
  ] : [];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary">
              <Star size={24} className="fill-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                Review Intelligence <Sparkles size={18} className="ml-2 text-primary" />
              </h1>
              <p className="text-gray-500 text-sm">Powered by BizBuddy AI ✨</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select className="flex-1 md:w-auto bg-white border border-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none">
              <option>Bulan Ini</option>
              <option>Bulan Lalu</option>
              <option>Semua Waktu</option>
            </select>
            <button className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 px-4 rounded-xl transition-colors">
              <Download size={18} className="mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Top Stats Row */}
        {!isLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Sentimen Keseluruhan */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative overflow-hidden">
              <h3 className="text-gray-500 font-semibold text-sm mb-4">Sentimen Keseluruhan</h3>
              <div className="relative h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-gray-900">{stats.averageRating}</span>
                  <div className="mt-1">{renderStars(Math.round(stats.averageRating))}</div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center text-xs text-gray-600"><div className="w-2 h-2 rounded-full bg-[#FF6B35] mr-1.5"></div>Positif {stats.sentimentPercentage.positive}%</div>
                <div className="flex items-center text-xs text-gray-600"><div className="w-2 h-2 rounded-full bg-[#A8B3CF] mr-1.5"></div>Netral {stats.sentimentPercentage.neutral}%</div>
                <div className="flex items-center text-xs text-gray-600"><div className="w-2 h-2 rounded-full bg-[#FFB347] mr-1.5"></div>Negatif {stats.sentimentPercentage.negative}%</div>
              </div>
            </div>

            {/* Card 2: Total Ulasan */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div>
                <h3 className="text-gray-500 font-semibold text-sm mb-2">Total Ulasan</h3>
                <p className="text-5xl font-bold text-gray-900">{stats.totalReviews.toLocaleString()}</p>
              </div>
              <div className="absolute top-6 right-6 text-primary opacity-20">
                <MessageSquare size={64} />
              </div>
              <div className="flex items-center text-green-500 text-sm font-semibold mt-4 bg-green-50 w-fit px-2 py-1 rounded-lg">
                <TrendingUp size={16} className="mr-1" /> +12% vs bulan lalu
              </div>
            </div>

            {/* Card 3: Topik Tren */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-500 font-semibold text-sm">Topik Sedang Tren 🔥</h3>
                <TrendingUp size={24} className="text-primary" />
              </div>
              <p className="text-2xl font-bold text-gray-900 italic my-auto">"{stats.trendingTopics[0]?.name || 'Pelayanan'}"</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {stats.trendingTopics.slice(1, 4).map((topic, i) => (
                  <span key={i} className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                    #{topic.name.replace(/\s+/g, '')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI REVIEW ANALYZER (HERO SECTION) */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Analyzer Manual</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: Input Panel */}
            <div className="bg-white rounded-2xl border-t-4 border-t-primary border-gray-100 shadow-sm p-6">
              <div className="flex items-center mb-2">
                <Bot size={24} className="text-primary mr-2" />
                <h2 className="text-xl font-bold text-gray-900">AI Review Analyzer</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">Analisis otomatis sentimen pelanggan dan dapatkan saran balasan dari AI.</p>
              
              <textarea
                value={analyzeText}
                onChange={(e) => setAnalyzeText(e.target.value)}
                placeholder="Paste review pelanggan di sini untuk dianalisis cepat..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-y min-h-[180px] mb-6 transition-all"
              ></textarea>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Sumber:</label>
                <div className="flex flex-wrap gap-2">
                  {sources.map(src => (
                    <button
                      key={src}
                      onClick={() => handleSourceToggle(src)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${selectedSources.includes(src) ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-70"
              >
                {isAnalyzing ? (
                  <><Loader2 size={20} className="animate-spin mr-2" /> Menganalisis...</>
                ) : (
                  <><Sparkles size={20} className="mr-2" /> Analisis dengan AI ✨</>
                )}
              </button>
            </div>

            {/* RIGHT COLUMN: AI Results */}
            <div className="flex flex-col gap-4">
              {!isAnalyzing && !aiResult && (
                <div className="h-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center">
                  <Bot size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Hasil analisis AI akan muncul di sini.</p>
                  <p className="text-gray-400 text-sm mt-1">Masukkan teks ulasan di panel sebelah kiri.</p>
                </div>
              )}

              {isAnalyzing && (
                <>
                  <div className="bg-gray-50 rounded-2xl h-32 animate-pulse"></div>
                  <div className="bg-gray-50 rounded-2xl h-32 animate-pulse"></div>
                  <div className="bg-gray-50 rounded-2xl h-40 animate-pulse"></div>
                </>
              )}

              {aiResult && !isAnalyzing && (
                <>
                  {/* Result Card 1: Positives */}
                  <div className="bg-[#f0fdf4] border-l-4 border-l-green-500 rounded-r-2xl p-5 shadow-sm animate-slide-up" style={{ animationDelay: '0ms' }}>
                    <div className="flex items-center mb-3">
                      <ThumbsUp size={20} className="text-green-600 mr-2" />
                      <h3 className="font-bold text-green-700">Pelanggan Suka</h3>
                    </div>
                    {aiResult.positives.length > 0 ? (
                      <ul className="space-y-2">
                        {aiResult.positives.map((item, idx) => (
                          <li key={idx} className="flex items-start text-sm text-green-800">
                            <span className="mr-2 font-bold">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-700/70 italic">Tidak ada poin positif spesifik yang ditemukan.</p>
                    )}
                  </div>

                  {/* Result Card 2: Negatives */}
                  <div className="bg-[#fef2f2] border-l-4 border-l-red-500 rounded-r-2xl p-5 shadow-sm animate-slide-up" style={{ animationDelay: '150ms' }}>
                    <div className="flex items-center mb-3">
                      <ThumbsDown size={20} className="text-red-600 mr-2" />
                      <h3 className="font-bold text-red-700">Perlu Diperbaiki</h3>
                    </div>
                    {aiResult.negatives.length > 0 ? (
                      <ul className="space-y-2">
                        {aiResult.negatives.map((item, idx) => (
                          <li key={idx} className="flex items-start text-sm text-red-800">
                            <span className="mr-2 font-bold">⚠</span> {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-red-700/70 italic">Kabar baik! Tidak ada keluhan spesifik.</p>
                    )}
                  </div>

                  {/* Result Card 3: Recommendation & Draft */}
                  <div className="bg-[#eff6ff] border-l-4 border-l-blue-500 rounded-r-2xl p-5 shadow-sm animate-slide-up flex flex-col h-full" style={{ animationDelay: '300ms' }}>
                    <div className="flex items-center mb-3">
                      <Sparkles size={20} className="text-blue-600 mr-2" />
                      <h3 className="font-bold text-blue-700">Rekomendasi AI Bisnis</h3>
                    </div>
                    <p className="text-sm text-blue-900 mb-5 leading-relaxed">
                      {aiResult.recommendation}
                    </p>
                    <div className="mt-auto pt-4 border-t border-blue-200">
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Draft Balasan Cepat</p>
                      <p className="text-sm text-blue-900 italic bg-white/60 p-3 rounded-lg mb-3">
                        "{aiResult.suggestedReply}"
                      </p>
                      <button 
                        onClick={() => handleCopyDraft('analyzer', aiResult.suggestedReply)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center text-sm"
                      >
                        {copiedDraftId === 'analyzer' ? <><Check size={16} className="mr-2"/> Tersalin!</> : 'Salin Draft Balasan'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ULASAN TERBARU */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Ulasan Terbaru</h2>
            <button className="text-primary font-bold text-sm hover:text-orange-600 transition-colors">Lihat Semua</button>
          </div>

          {reviews.length === 0 && !isLoading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada ulasan</h3>
              <p className="text-gray-500 max-w-md mx-auto">Paste review pertama kamu di analyzer untuk mulai mendapatkan insight AI</p>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                      {review.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{review.customerName}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPlatformColor(review.platform)}`}>
                          {review.platform}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white
                    ${review.sentiment === 'positive' ? 'bg-green-500' : review.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'}`}>
                    {review.sentiment === 'positive' ? 'POSITIF' : review.sentiment === 'negative' ? 'NEGATIF' : 'NETRAL'}
                  </div>
                </div>

                <div className="mb-2">
                  {renderStars(review.rating)}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  "{review.reviewText}"
                </p>

                {/* AI Draft Reply for Negative Reviews */}
                {review.sentiment === 'negative' && review.aiAnalyzed && review.suggestedReply && (
                  <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 ml-0 md:ml-12 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot size={16} className="text-primary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Draft Balasan AI</span>
                    </div>
                    <p className="text-sm text-gray-700 italic mb-3">
                      "{review.suggestedReply}"
                    </p>
                    <button 
                      onClick={() => handleCopyDraft(review._id, review.suggestedReply)}
                      className="text-xs font-bold text-primary border border-primary px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors flex items-center"
                    >
                      {copiedDraftId === review._id ? <><Check size={14} className="mr-1"/> Disalin!</> : <><Copy size={14} className="mr-1"/> Gunakan Draft Ini</>}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Reviews;
