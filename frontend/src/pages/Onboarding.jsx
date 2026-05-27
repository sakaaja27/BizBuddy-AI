import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import { Check, ArrowLeft, Loader2, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';

const businessTypes = [
  { id: 'fnb', label: 'F&B', emoji: '🍱', desc: 'Warung, Restoran, Catering, Kafe' },
  { id: 'fashion', label: 'Fashion & Thrift', emoji: '👗', desc: 'Pakaian, Aksesoris, Sepatu' },
  { id: 'jasa', label: 'Jasa', emoji: '💆', desc: 'Salon, Laundry, Servis, Bengkel' },
  { id: 'retail', label: 'Retail & Sembako', emoji: '🛒', desc: 'Toko kelontong, Minimarket' },
  { id: 'home_industry', label: 'Home Industry', emoji: '🎂', desc: 'Kue, Kerajinan, Produk rumahan' },
  { id: 'other', label: 'Lainnya', emoji: '📦', desc: 'Jenis bisnis lainnya' },
];

const platformOptions = ['WhatsApp', 'Shopee', 'Tokopedia', 'GoFood', 'GrabFood', 'Offline/Toko', 'Lainnya'];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUser, user } = useAuthStore();

  const [businessType, setBusinessType] = useState('');
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    city: '',
    yearsRunning: '',
    productCount: '',
    platforms: []
  });
  
  const [productInfo, setProductInfo] = useState({
    name: '',
    category: '',
    price: '',
    buyPrice: '',
    stock: '',
    unit: 'pcs',
    minStock: '5'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // If onboarding is complete, redirect
    if (user?.isOnboardingComplete) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateStep2 = () => {
    const newErrors = {};
    if (!businessInfo.businessName.trim()) newErrors.businessName = 'Nama bisnis wajib diisi';
    if (!businessInfo.city.trim()) newErrors.city = 'Kota wajib diisi';
    if (!businessInfo.yearsRunning) newErrors.yearsRunning = 'Lama berjalan wajib diisi';
    if (!businessInfo.productCount) newErrors.productCount = 'Jumlah produk wajib diisi';
    if (businessInfo.platforms.length === 0) newErrors.platforms = 'Pilih minimal 1 platform';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!productInfo.name.trim()) newErrors.name = 'Nama produk wajib diisi';
    if (!productInfo.price) newErrors.price = 'Harga jual wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep1 = async () => {
    if (!businessType) return;
    setLoading(true);
    try {
      await axios.post('/onboarding/step1', { businessType });
      setStep(2);
    } catch (err) {
      toast.error('Gagal menyimpan jenis bisnis');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep2 = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await axios.post('/onboarding/step2', businessInfo);
      setStep(3);
    } catch (err) {
      toast.error('Gagal menyimpan info bisnis');
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    
    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
    }, 250);
  };

  const finishOnboarding = async (skipProduct = false) => {
    if (!skipProduct && !validateStep3()) return;
    setLoading(true);
    try {
      const res = await axios.post('/onboarding/step3', {
        product: skipProduct ? null : {
          ...productInfo,
          price: parseInt(productInfo.price.replace(/\D/g, '') || '0', 10),
          buyPrice: productInfo.buyPrice ? parseInt(productInfo.buyPrice.replace(/\D/g, ''), 10) : undefined,
          stock: parseInt(productInfo.stock || '0', 10),
          minStock: parseInt(productInfo.minStock || '5', 10)
        }
      });
      
      const business = res.data.business;
      updateUser({ 
        isOnboardingComplete: true,
        businessName: business?.businessName,
        businessType: business?.businessType,
        city: business?.city,
        description: business?.description,
        address: business?.address
      });
      
      triggerConfetti();
      toast.success('Selamat datang di BizBuddy AI! Toko kamu sudah siap 🎉', { duration: 5000 });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      toast.error('Gagal memproses pendaftaran');
      setLoading(false);
    }
  };

  const formatRupiah = (value) => {
    const number = value.replace(/\D/g, '');
    return number ? new Intl.NumberFormat('id-ID').format(number) : '';
  };

  const togglePlatform = (p) => {
    const isSelected = businessInfo.platforms.includes(p);
    let newPlatforms = isSelected ? businessInfo.platforms.filter(x => x !== p) : [...businessInfo.platforms, p];
    setBusinessInfo({ ...businessInfo, platforms: newPlatforms });
    if (errors.platforms && newPlatforms.length > 0) setErrors({ ...errors, platforms: null });
  };

  const getPlaceholder = (field) => {
    if (field === 'name') {
      switch(businessType) {
        case 'fnb': return 'contoh: Warung Makan Bu Sari';
        case 'fashion': return 'contoh: Thrift Store Keren';
        case 'jasa': return 'contoh: Salon Cantik';
        case 'retail': return 'contoh: Toko Sembako Pak Budi';
        case 'home_industry': return 'contoh: Dapur Kue Mama';
        default: return 'contoh: Bisnis Saya';
      }
    }
    if (field === 'productName') {
      switch(businessType) {
        case 'fnb': return 'contoh: Nasi Goreng Spesial';
        case 'fashion': return 'contoh: Kaos Polos Oversize';
        case 'jasa': return 'contoh: Cuci + Setrika';
        case 'retail': return 'contoh: Beras Premium 5kg';
        case 'home_industry': return 'contoh: Brownies Panggang';
        default: return 'contoh: Produk Pertama';
      }
    }
    return '';
  };

  const getCategories = () => {
    switch(businessType) {
      case 'fnb': return ['Makanan Utama', 'Minuman', 'Snack', 'Paket', 'Bahan Baku'];
      case 'fashion': return ['Atasan', 'Bawahan', 'Dress', 'Aksesoris', 'Sepatu'];
      case 'jasa': return ['Perawatan', 'Cuci', 'Servis', 'Paket'];
      case 'retail': return ['Sembako', 'Minuman', 'Snack', 'Kebutuhan Rumah'];
      case 'home_industry': return ['Kue Kering', 'Kue Basah', 'Kerajinan', 'Lainnya'];
      default: return ['Kategori A', 'Kategori B'];
    }
  };

  const getUnits = () => {
    switch(businessType) {
      case 'fnb': return ['porsi', 'kg', 'liter', 'pcs'];
      case 'fashion': return ['pcs'];
      case 'retail': return ['pcs', 'kg', 'liter', 'karton'];
      case 'home_industry': return ['pcs', 'loyang', 'lusin'];
      default: return ['pcs'];
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-100 py-4 px-6 flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex items-center">
          <span className="text-2xl mr-2">🤖</span>
          <span className="font-bold text-lg text-secondary">BizBuddy</span>
          <span className="font-bold text-lg text-accent">AI</span>
        </div>
        <a href="#" className="text-sm font-medium text-gray-400 hover:text-gray-600">Butuh bantuan?</a>
      </div>

      <div className={`mx-auto px-4 pt-8 pb-20 overflow-hidden transition-all duration-500 ${step === 3 ? 'max-w-5xl' : 'max-w-[640px]'}`}>
        {/* Progress */}
        <div className="mb-10">
          <div className="text-xs font-bold text-gray-400 mb-3 text-center uppercase tracking-widest">Langkah {step} dari 3</div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
          <div className="flex justify-between px-2">
            <div className={`text-xs font-bold text-center w-1/3 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              Jenis Bisnis {step > 1 && <span className="ml-1 inline-block bg-primary/20 text-primary rounded-full px-1 text-[10px]">✓</span>}
            </div>
            <div className={`text-xs font-bold text-center w-1/3 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              Info Toko {step > 2 && <span className="ml-1 inline-block bg-primary/20 text-primary rounded-full px-1 text-[10px]">✓</span>}
            </div>
            <div className={`text-xs font-bold text-center w-1/3 ${step === 3 ? 'text-primary' : 'text-gray-400'}`}>Produk Pertama</div>
          </div>
        </div>

        {/* Form Container with simple transition wrapper */}
        <div className="relative">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <div className="text-6xl mb-4">🏪</div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">Bisnis kamu bergerak di bidang apa?</h1>
                <p className="text-gray-500 font-medium">Kami akan menyesuaikan dashboard dan AI sesuai jenis bisnismu</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {businessTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setBusinessType(type.id)}
                    className={`p-5 rounded-2xl border text-left transition-all relative ${
                      businessType === type.id 
                        ? 'border-primary bg-orange-50 shadow-md scale-[1.02]' 
                        : 'border-gray-100 bg-white shadow-sm hover:border-orange-300 hover:shadow-md hover:scale-[1.02]'
                    }`}
                  >
                    <div className="text-3xl mb-3 text-center">{type.emoji}</div>
                    <div className="font-bold text-gray-900 text-center mb-1">{type.label}</div>
                    <div className="text-xs text-gray-500 text-center px-2">{type.desc}</div>
                    {businessType === type.id && (
                      <div className="absolute -top-3 -right-3 bg-primary text-white rounded-full p-1.5 shadow-md">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextStep1}
                disabled={!businessType || loading}
                className="w-full bg-primary hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-full transition-all text-lg flex items-center justify-center shadow-lg shadow-primary/30 disabled:shadow-none"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : 'Lanjut →'}
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <div className="text-6xl mb-4">📝</div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">Ceritakan bisnis kamu</h1>
                <p className="text-gray-500 font-medium">Info ini membantu AI memberikan saran yang lebih tepat dan personal</p>
              </div>

              <div className="space-y-6 mb-10">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Toko / Bisnis <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={businessInfo.businessName}
                    onChange={(e) => {
                      setBusinessInfo({...businessInfo, businessName: e.target.value});
                      if(errors.businessName) setErrors({...errors, businessName: null});
                    }}
                    onBlur={() => !businessInfo.businessName.trim() && setErrors({...errors, businessName: 'Nama bisnis wajib diisi'})}
                    className={`w-full px-4 py-3.5 border rounded-xl outline-none font-medium transition-colors ${errors.businessName ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-primary bg-gray-50'}`}
                    placeholder={getPlaceholder('name')}
                  />
                  {errors.businessName && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.businessName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Kota / Kabupaten <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={businessInfo.city}
                    onChange={(e) => {
                      setBusinessInfo({...businessInfo, city: e.target.value});
                      if(errors.city) setErrors({...errors, city: null});
                    }}
                    onBlur={() => !businessInfo.city.trim() && setErrors({...errors, city: 'Kota wajib diisi'})}
                    className={`w-full px-4 py-3.5 border rounded-xl outline-none font-medium transition-colors ${errors.city ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-primary bg-gray-50'}`}
                    placeholder="contoh: Surabaya"
                  />
                  {errors.city && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Sudah berjalan berapa lama? <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {['< 1 tahun', '1-3 tahun', '> 3 tahun'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setBusinessInfo({...businessInfo, yearsRunning: opt}); if(errors.yearsRunning) setErrors({...errors, yearsRunning: null}); }}
                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                          businessInfo.yearsRunning === opt ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.yearsRunning && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.yearsRunning}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah produk / layanan kira-kira? <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {['< 10', '10-50', '> 50'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setBusinessInfo({...businessInfo, productCount: opt}); if(errors.productCount) setErrors({...errors, productCount: null}); }}
                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                          businessInfo.productCount === opt ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.productCount && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.productCount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Jualan di platform mana? <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {platformOptions.map(opt => (
                      <button
                        key={opt}
                        onClick={() => togglePlatform(opt)}
                        className={`px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                          businessInfo.platforms.includes(opt) ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.platforms && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.platforms}</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-transparent border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-4 rounded-full transition-all"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleNextStep2}
                  disabled={loading}
                  className="w-2/3 bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-full transition-all flex items-center justify-center shadow-lg shadow-primary/30"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : 'Lanjut →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-fade-in">
              
              {/* HEADER */}
              <div className="text-center mb-12">
                <div className="text-6xl mb-5">🎉</div>

                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
                  Hampir selesai! Tambah produk pertama
                </h1>

                <p className="text-gray-500 font-medium text-base">
                  Opsional — kamu bisa menambahkan produk kapan saja nanti
                </p>
              </div>

              {/* CONTENT */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start mb-12">

                {/* FORM */}
                <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm space-y-6">

                  {/* NAMA */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Produk <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={productInfo.name}
                      onChange={(e) => {
                        setProductInfo({
                          ...productInfo,
                          name: e.target.value,
                        });

                        if (errors.name)
                          setErrors({
                            ...errors,
                            name: null,
                          });
                      }}
                      className={`
                        w-full px-5 py-3.5 border rounded-2xl outline-none font-medium
                        transition-all duration-200 bg-white
                        ${errors.name
                          ? "border-red-500"
                          : "border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
                        }
                      `}
                      placeholder={getPlaceholder("productName")}
                    />

                    {errors.name && (
                      <p className="text-red-500 text-xs font-semibold mt-2">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* KATEGORI */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kategori
                    </label>

                    <select
                      value={productInfo.category}
                      onChange={(e) =>
                        setProductInfo({
                          ...productInfo,
                          category: e.target.value,
                        })
                      }
                      className="
                        w-full px-5 py-3.5 border border-gray-200 rounded-2xl
                        outline-none font-medium bg-white appearance-none
                        transition-all duration-200
                        focus:border-primary focus:ring-4 focus:ring-primary/10
                      "
                    >
                      <option value="">Pilih Kategori...</option>

                      {getCategories().map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* HARGA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* HARGA JUAL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Harga Jual <span className="text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                          Rp
                        </span>

                        <input
                          type="text"
                          value={productInfo.price}
                          onChange={(e) => {
                            setProductInfo({
                              ...productInfo,
                              price: formatRupiah(e.target.value),
                            });

                            if (errors.price)
                              setErrors({
                                ...errors,
                                price: null,
                              });
                          }}
                          className={`
                            w-full pl-12 pr-5 py-3.5 border rounded-2xl outline-none
                            font-semibold transition-all duration-200 bg-white
                            ${errors.price
                              ? "border-red-500"
                              : "border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
                            }
                          `}
                          placeholder="25.000"
                        />
                      </div>

                      {errors.price && (
                        <p className="text-red-500 text-xs font-semibold mt-2">
                          {errors.price}
                        </p>
                      )}
                    </div>

                    {/* MODAL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Harga Modal{" "}
                       
                      </label>

                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                          Rp
                        </span>

                        <input
                          type="text"
                          value={productInfo.buyPrice}
                          onChange={(e) =>
                            setProductInfo({
                              ...productInfo,
                              buyPrice: formatRupiah(e.target.value),
                            })
                          }
                          className="
                            w-full pl-12 pr-5 py-3.5 border border-gray-200 rounded-2xl
                            outline-none font-semibold bg-white
                            transition-all duration-200
                            focus:border-primary focus:ring-4 focus:ring-primary/10
                          "
                          placeholder="15.000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* STOCK */}
                  {businessType !== "jasa" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                      {/* STOK */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Stok Awal
                        </label>

                        <div className="flex">
                          <input
                            type="number"
                            value={productInfo.stock}
                            onChange={(e) =>
                              setProductInfo({
                                ...productInfo,
                                stock: e.target.value,
                              })
                            }
                            className="
                              w-3/5 px-5 py-3.5 border border-r-0 border-gray-200
                              rounded-l-2xl outline-none font-semibold
                              focus:border-primary bg-white
                            "
                            placeholder="0"
                          />

                          <select
                            value={productInfo.unit}
                            onChange={(e) =>
                              setProductInfo({
                                ...productInfo,
                                unit: e.target.value,
                              })
                            }
                            className="
                              w-2/5 pl-3 pr-8 py-3.5 border border-gray-200 rounded-r-2xl
                              outline-none font-semibold bg-gray-50 text-sm
                              focus:border-primary truncate
                            "
                          >
                            {getUnits().map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* MIN STOCK */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Stok Minimum 
                        </label>

                        <input
                          type="number"
                          value={productInfo.minStock}
                          onChange={(e) =>
                            setProductInfo({
                              ...productInfo,
                              minStock: e.target.value,
                            })
                          }
                          className="
                            w-full px-5 py-3.5 border border-gray-200 rounded-2xl
                            outline-none font-semibold bg-white
                            transition-all duration-200
                            focus:border-primary focus:ring-4 focus:ring-primary/10
                          "
                          placeholder="5"
                        />

                        <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5 leading-relaxed">
                          <Info size={14} className="mt-[1px] shrink-0" />
                          AI akan mengingatkan jika stok dibawah angka minimum ini
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* PREVIEW */}
                <div className="w-full max-w-md mx-auto xl:max-w-none">

                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 text-center xl:text-left">
                    Preview Produk
                  </p>

                  <div
                    className="
                      bg-gradient-to-b from-white to-gray-50/80
                      rounded-[32px]
                      p-6
                      border border-gray-100
                      shadow-xl shadow-gray-200/40
                      transition-all duration-300
                      hover:-translate-y-1
                    "
                  >

                    {/* IMAGE */}
                    <div
                      className="
                        w-full aspect-square
                        rounded-[28px]
                        bg-gradient-to-br from-gray-50 to-gray-100
                        border border-gray-100
                        shadow-inner
                        flex items-center justify-center
                        text-7xl
                        mb-6
                      "
                    >
                      {businessTypes.find((t) => t.id === businessType)?.emoji || "📦"}
                    </div>

                    {/* CATEGORY */}
                    {productInfo.category && (
                      <span
                        className="
                          inline-flex items-center
                          px-3 py-1
                          rounded-full
                          bg-orange-50
                          text-primary
                          text-[11px]
                          font-bold
                          uppercase
                          tracking-wide
                          mb-3
                        "
                      >
                        {productInfo.category}
                      </span>
                    )}

                    {/* TITLE */}
                    <h3
                      className={`
                        text-2xl font-extrabold tracking-tight mb-2 leading-tight
                        ${productInfo.name ? "text-gray-900" : "text-gray-300"}
                      `}
                    >
                      {productInfo.name || "Nama Produk"}
                    </h3>

                    {/* PRICE */}
                    <p
                      className={`
                        text-3xl font-black mb-6
                        ${productInfo.price ? "text-primary" : "text-gray-300"}
                      `}
                    >
                      Rp {productInfo.price || "0"}
                    </p>

                    {/* STOCK */}
                    {businessType !== "jasa" && (
                      <div>

                        <div className="flex justify-between items-center mb-2">

                          <span className="text-sm font-semibold text-gray-500">
                            Stok: {productInfo.stock || "0"} {productInfo.unit}
                          </span>

                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            Aman
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full w-full bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-3">

                <button
                  onClick={() => finishOnboarding(false)}
                  disabled={loading}
                  className="
                    w-full
                    bg-gradient-to-r from-primary to-orange-500
                    hover:from-orange-600 hover:to-orange-600
                    text-white
                    font-extrabold
                    py-3.5
                    rounded-2xl
                    transition-all duration-200
                    shadow-xl shadow-primary/30
                    flex justify-center items-center
                    text-lg
                  "
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    "Selesai & Mulai BizBuddy! 🚀"
                  )}
                </button>

                <button
                  onClick={() => finishOnboarding(true)}
                  disabled={loading}
                  className="
                    w-full
                    bg-transparent
                    text-gray-400
                    font-bold
                    py-3
                    rounded-2xl
                    hover:text-gray-600
                    transition-colors
                  "
                >
                  Lewati, isi nanti
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
