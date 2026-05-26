import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Check, X, ChevronDown, ChevronUp, Sparkles, MessageCircle, Star } from 'lucide-react';

const Upgrade = ({ standalone = false }) => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const premiumPrice = billing === 'monthly' ? '99.000' : '66.000';

  const faqs = [
    { q: 'Apakah kartu kredit diperlukan untuk mulai?', a: 'Tidak! Plan gratis bisa langsung dipakai tanpa kartu kredit. Cukup daftar dan langsung gunakan BizBuddy AI.' },
    { q: 'Bisa upgrade atau downgrade kapanpun?', a: 'Ya, kamu bisa ubah plan kapanpun. Jika downgrade, fitur premium tetap aktif hingga akhir periode billing.' },
    { q: 'Data saya aman?', a: 'Semua data dienkripsi dan disimpan aman di server Indonesia. Kami tidak pernah menjual data kamu.' },
    { q: 'Bagaimana cara pembayaran?', a: 'Transfer bank, GoPay, OVO, QRIS, dan kartu kredit/debit.' },
    { q: 'Ada garansi uang kembali?', a: 'Ya! Garansi 7 hari uang kembali jika tidak puas, tanpa pertanyaan.' },
  ];

  const features = [
    { name: 'Pesanan per bulan', free: '50', premium: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'Produk', free: '10', premium: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'AI Chat', free: '20/hari', premium: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'Review AI', free: '10/bulan', premium: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'AI Daily Report', free: false, premium: true, enterprise: true },
    { name: 'Export Laporan', free: false, premium: true, enterprise: true },
    { name: 'Draft Balasan AI', free: false, premium: true, enterprise: true },
    { name: 'Prediksi Restock', free: false, premium: true, enterprise: true },
    { name: 'Analitik Lengkap', free: false, premium: true, enterprise: true },
    { name: 'Keuangan & Export', free: false, premium: true, enterprise: true },
    { name: 'Multi User', free: false, premium: false, enterprise: true },
    { name: 'Custom AI Training', free: false, premium: false, enterprise: true },
    { name: 'Priority Support', free: false, premium: true, enterprise: true },
  ];

  const testimonials = [
    {
      initials: 'SR', color: 'bg-primary',
      name: 'Siti Rahayu', business: 'Warung Makan Bu Siti, Surabaya',
      quote: 'BizBuddy AI bantu saya tau produk mana yang laris tanpa harus ngitung manual. Pendapatan naik 30% dalam 2 bulan!',
    },
    {
      initials: 'AB', color: 'bg-[#1E3A8A]',
      name: 'Ahmad Budiman', business: 'Thrift Store Keren, Bandung',
      quote: 'Fitur review AI-nya luar biasa! Bisa tau keluhan pelanggan langsung dan auto-reply. Hemat waktu banget.',
    },
    {
      initials: 'DL', color: 'bg-amber-500',
      name: 'Dewi Lestari', business: 'Dapur Kue Mama, Jakarta',
      quote: 'Laporan keuangan otomatis bikin saya gak perlu akuntan lagi. Worth it banget buat UMKM!',
    },
  ];

  const FeatureCheck = ({ value }) => {
    if (value === true) return <Check size={18} className="text-primary mx-auto" strokeWidth={3} />;
    if (value === false) return <X size={18} className="text-gray-300 mx-auto" strokeWidth={3} />;
    return <span className="text-sm font-bold text-gray-700">{value}</span>;
  };

  const content = (
    <div>
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0f2057] via-[#1a3580] to-[#0d1b3e] py-16 px-4 md:py-24 -mx-4 md:-mx-8 lg:-mx-12 mb-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #FF6B35 0%, transparent 50%), radial-gradient(circle at 70% 30%, #3498DB 0%, transparent 50%)' }} />
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-block bg-primary/20 border border-primary/40 text-orange-300 text-sm font-bold px-4 py-2 rounded-full mb-6">🚀 Tingkatkan Bisnis Kamu</span>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">Pilih Plan yang Tepat</h1>
          <p className="text-white/70 text-lg mb-8">Mulai gratis, upgrade kapanpun bisnis kamu berkembang</p>

          {/* Billing Toggle */}
          <div className="inline-flex bg-white/10 backdrop-blur-sm p-1.5 rounded-full border border-white/20">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-white text-gray-900 shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billing === 'yearly' ? 'bg-white text-gray-900 shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              Tahunan
              {billing === 'yearly' && <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Hemat 33%!</span>}
              {billing !== 'yearly' && <span className="bg-green-400/30 text-green-300 text-[10px] font-black px-2 py-0.5 rounded-full">-33%</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-start">
        {/* Free Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Gratis</p>
          <div className="mb-1">
            <span className="text-4xl font-black text-gray-700">Rp 0</span>
            <span className="text-gray-400 font-semibold"> /bulan</span>
          </div>
          <p className="text-sm text-gray-400 mb-6">Untuk mulai mencoba</p>
          <hr className="border-gray-100 mb-6" />
          <ul className="space-y-3 mb-8">
            {['50 pesanan per bulan', '10 analisis review AI', 'Maksimal 10 produk', '20 pesan AI chat per hari', 'Dashboard dasar'].map(f => (
              <li key={f} className="flex items-start text-sm font-medium text-gray-600">
                <Check size={16} className="text-green-500 mr-2.5 mt-0.5 flex-shrink-0" strokeWidth={3} /> {f}
              </li>
            ))}
            {['AI Daily Report', 'Export laporan', 'Draft balasan AI unlimited', 'Prediksi restock AI', 'Analitik lengkap'].map(f => (
              <li key={f} className="flex items-start text-sm font-medium text-gray-300 line-through">
                <X size={16} className="text-gray-200 mr-2.5 mt-0.5 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <button disabled className="w-full py-3.5 rounded-full border-2 border-gray-200 text-gray-400 font-bold cursor-not-allowed text-sm">Plan Saat Ini</button>
        </div>

        {/* Premium Card */}
        <div className="bg-orange-50/70 rounded-3xl border-2 border-primary shadow-xl shadow-primary/10 p-7 md:scale-105 relative">
          <div className="absolute -top-4 left-0 right-0 flex justify-center">
            <span className="bg-primary text-white text-xs font-black px-5 py-1.5 rounded-full shadow-lg shadow-primary/30">⭐ PALING POPULER</span>
          </div>
          <p className="text-sm font-black text-primary uppercase tracking-wider mb-2">Premium</p>
          <div className="mb-1">
            <span className="text-4xl font-black text-gray-900">Rp {premiumPrice}</span>
            <span className="text-gray-500 font-semibold"> /bulan</span>
          </div>
          {billing === 'yearly' && <p className="text-xs text-gray-400 mb-1">(Rp 799.000/tahun)</p>}
          <p className="text-sm text-gray-500 mb-6">Untuk bisnis yang berkembang</p>
          <hr className="border-orange-200 mb-6" />
          <ul className="space-y-3 mb-8">
            {['Pesanan unlimited', 'Analisis review AI unlimited', 'Produk unlimited', 'AI chat unlimited', 'Dashboard lengkap'].map(f => (
              <li key={f} className="flex items-start text-sm font-medium text-gray-700">
                <Check size={16} className="text-green-500 mr-2.5 mt-0.5 flex-shrink-0" strokeWidth={3} /> {f}
              </li>
            ))}
            {['AI Daily Report otomatis', 'Export PDF & Excel', 'Draft balasan AI unlimited', 'Prediksi restock AI', 'Analitik & Keuangan lengkap', 'Priority support'].map(f => (
              <li key={f} className="flex items-start text-sm font-bold text-primary">
                <Check size={16} className="text-primary mr-2.5 mt-0.5 flex-shrink-0" strokeWidth={3} /> {f}
              </li>
            ))}
          </ul>
          <button className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-black text-sm shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]">
            Mulai Premium Sekarang →
          </button>
        </div>

        {/* Enterprise Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <p className="text-sm font-black text-[#1E3A8A] uppercase tracking-wider mb-2">Enterprise</p>
          <div className="mb-1">
            <span className="text-4xl font-black text-gray-700">Custom</span>
          </div>
          <p className="text-sm text-gray-400 mb-6">Untuk bisnis skala besar</p>
          <hr className="border-gray-100 mb-6" />
          <ul className="space-y-3 mb-8">
            {['Semua fitur Premium', 'Multi-user / tim', 'Custom AI training', 'API access', 'Dedicated support', 'Custom integrasi', 'SLA guarantee'].map(f => (
              <li key={f} className="flex items-start text-sm font-medium text-gray-600">
                <Check size={16} className="text-[#1E3A8A] mr-2.5 mt-0.5 flex-shrink-0" strokeWidth={3} /> {f}
              </li>
            ))}
          </ul>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3.5 rounded-full bg-[#1E3A8A] hover:bg-[#1a3070] text-white font-black text-sm text-center transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} /> Hubungi Kami
          </a>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-12 overflow-hidden">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full p-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors"
        >
          <h2 className="text-lg font-black text-gray-900">Perbandingan Lengkap Fitur</h2>
          {showComparison ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
        </button>
        {showComparison && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 w-2/5">Fitur</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-500">Gratis</th>
                  <th className="px-4 py-4 text-center text-sm font-black text-primary bg-orange-50/70">Premium</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-[#1E3A8A]">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={f.name} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-700">{f.name}</td>
                    <td className="px-4 py-3.5 text-center"><FeatureCheck value={f.free} /></td>
                    <td className="px-4 py-3.5 text-center bg-orange-50/30"><FeatureCheck value={f.premium} /></td>
                    <td className="px-4 py-3.5 text-center"><FeatureCheck value={f.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Testimonials */}
      <div className="mb-12">
        <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Dipercaya UMKM Indonesia 🇮🇩</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 ${t.color} rounded-full flex items-center justify-center text-white font-black text-sm`}>{t.initials}</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400 font-medium">{t.business}</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed italic">"{t.quote}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Pertanyaan Umum</h2>
        <div className="space-y-3 max-w-3xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-5 flex justify-between items-center text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-bold text-gray-900 text-sm pr-4">{faq.q}</span>
                {openFaq === i ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-orange-500 rounded-3xl p-10 md:p-14 text-center shadow-2xl shadow-primary/30">
        <Sparkles size={40} className="text-white/30 mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Siap kelola bisnis lebih cerdas?</h2>
        <p className="text-white/80 text-lg mb-8">Bergabung dengan ribuan UMKM yang sudah pakai BizBuddy AI</p>
        <button
          onClick={() => navigate('/register')}
          className="bg-white text-primary font-black px-10 py-4 rounded-full text-lg shadow-lg hover:bg-orange-50 transition-all hover:scale-105"
        >
          Mulai Gratis Sekarang →
        </button>
      </div>
    </div>
  );

  if (standalone) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8 max-w-6xl mx-auto">
        {content}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {content}
      </div>
    </DashboardLayout>
  );
};

export default Upgrade;
