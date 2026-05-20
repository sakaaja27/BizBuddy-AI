import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import { Check } from 'lucide-react';

const businessTypes = [
  { id: 'fnb', label: 'F&B (Warung, Resto, Catering)', emoji: '🍱' },
  { id: 'fashion', label: 'Fashion & Thrift Store', emoji: '👗' },
  { id: 'jasa', label: 'Jasa (Salon, Laundry, Servis)', emoji: '💆' },
  { id: 'retail', label: 'Toko Sembako & Retail', emoji: '🛒' },
  { id: 'home_industry', label: 'Home Industry', emoji: '🎂' },
  { id: 'other', label: 'Lainnya', emoji: '📦' },
];

const platformOptions = ['WhatsApp', 'Shopee', 'Tokopedia', 'GoFood', 'GrabFood', 'Offline', 'Lainnya'];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();

  // Form State
  const [businessType, setBusinessType] = useState('');
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    city: '',
    yearsRunning: '< 1 tahun',
    productCount: '< 10',
    platforms: []
  });
  const [productInfo, setProductInfo] = useState({
    name: '',
    category: '',
    price: '',
    stock: ''
  });

  const togglePlatform = (platform) => {
    setBusinessInfo(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleNextStep1 = () => {
    if (businessType) setStep(2);
  };

  const handleNextStep2 = () => {
    if (businessInfo.businessName && businessInfo.city) setStep(3);
  };

  const finishOnboarding = async (skipProduct = false) => {
    setLoading(true);
    try {
      // 1. Save Business Info
      await axios.post('/onboarding/business', {
        ...businessInfo,
        businessType
      });

      // 2. Save Product if not skipped
      if (!skipProduct && productInfo.name && productInfo.price) {
        await axios.post('/onboarding/first-product', {
          ...productInfo,
          price: Number(productInfo.price),
          stock: Number(productInfo.stock || 0)
        });
      }

      // Update local state
      updateUser({ isOnboardingComplete: true });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      alert('Gagal menyimpan data: ' + (error.response?.data?.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Header */}
      <div className="max-w-3xl mx-auto pt-8 px-4">
        <div className="flex items-center mb-8">
          <span className="text-3xl mr-2">🤖</span>
          <span className="font-bold text-xl text-secondary">BizBuddy</span>
          <span className="font-bold text-xl text-accent">AI</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Step {step} of 3</span>
            <span className="text-sm font-medium text-primary">
              {step === 1 ? 'Jenis Bisnis' : step === 2 ? 'Info Toko' : 'Produk Pertama'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Pilih Jenis Bisnis */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bisnis kamu bergerak di bidang apa? 🏪</h1>
            <p className="text-gray-500 mb-8">Kami akan menyesuaikan dashboard sesuai jenis bisnismu</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {businessTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setBusinessType(type.id)}
                  className={`p-6 rounded-xl border-2 text-left transition-all relative ${
                    businessType === type.id 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-4xl mb-3">{type.emoji}</div>
                  <div className="font-semibold text-gray-900">{type.label}</div>
                  {businessType === type.id && (
                    <div className="absolute top-4 right-4 bg-primary text-white rounded-full p-1">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextStep1}
              disabled={!businessType}
              className="w-full bg-primary hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl transition-all"
            >
              Lanjut →
            </button>
          </div>
        )}

        {/* Step 2: Info Bisnis Kamu */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ceritakan bisnis kamu 📝</h1>
            <p className="text-gray-500 mb-8">Informasi ini membantu AI memberikan saran yang lebih tepat</p>

            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Toko/Bisnis <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={businessInfo.businessName}
                  onChange={(e) => setBusinessInfo({...businessInfo, businessName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Misal: Warung Makmur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kota <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={businessInfo.city}
                  onChange={(e) => setBusinessInfo({...businessInfo, city: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Misal: Jakarta Selatan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sudah berjalan berapa lama?</label>
                <div className="flex gap-3">
                  {['< 1 tahun', '1-3 tahun', '> 3 tahun'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setBusinessInfo({...businessInfo, yearsRunning: opt})}
                      className={`px-5 py-2 rounded-full border text-sm transition-all ${
                        businessInfo.yearsRunning === opt 
                          ? 'bg-secondary text-white border-secondary' 
                          : 'bg-white text-gray-600 border-gray-300 hover:border-secondary'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah produk kira-kira?</label>
                <div className="flex gap-3">
                  {['< 10', '10-50', '> 50'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setBusinessInfo({...businessInfo, productCount: opt})}
                      className={`px-5 py-2 rounded-full border text-sm transition-all ${
                        businessInfo.productCount === opt 
                          ? 'bg-secondary text-white border-secondary' 
                          : 'bg-white text-gray-600 border-gray-300 hover:border-secondary'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jualan di platform mana?</label>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => togglePlatform(opt)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                        businessInfo.platforms.includes(opt)
                          ? 'bg-primary/10 text-primary border-primary font-medium' 
                          : 'bg-white text-gray-600 border-gray-300 hover:border-primary/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-4 rounded-xl transition-all"
              >
                ← Kembali
              </button>
              <button
                onClick={handleNextStep2}
                disabled={!businessInfo.businessName || !businessInfo.city}
                className="w-2/3 bg-primary hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl transition-all"
              >
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Tambah Produk Pertama */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tambah produk pertama kamu! 🎉</h1>
            <p className="text-gray-500 mb-8">Opsional - kamu bisa menambahkan produk nanti</p>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Produk</label>
                <input 
                  type="text" 
                  value={productInfo.name}
                  onChange={(e) => setProductInfo({...productInfo, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Misal: Nasi Goreng Spesial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <input 
                  type="text" 
                  value={productInfo.category}
                  onChange={(e) => setProductInfo({...productInfo, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Misal: Makanan Utama"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harga Jual</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                    <input 
                      type="number" 
                      value={productInfo.price}
                      onChange={(e) => setProductInfo({...productInfo, price: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stok Awal</label>
                  <input 
                    type="number" 
                    value={productInfo.stock}
                    onChange={(e) => setProductInfo({...productInfo, stock: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => finishOnboarding(false)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/30 flex justify-center items-center"
              >
                {loading ? 'Memproses...' : 'Mulai Pakai BizBuddy! 🚀'}
              </button>
              <button
                onClick={() => finishOnboarding(true)}
                disabled={loading}
                className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-xl transition-all"
              >
                Lewati, isi nanti
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
