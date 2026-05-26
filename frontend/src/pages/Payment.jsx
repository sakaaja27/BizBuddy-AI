import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Shield, Copy, CreditCard, ChevronDown, ChevronRight, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import axios from 'axios';
import confetti from 'canvas-confetti';

const Payment = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialBilling = queryParams.get('billing') === 'yearly' ? 'yearly' : 'monthly';

  const [billing, setBilling] = useState(initialBilling);
  const [method, setMethod] = useState('transfer'); // transfer, ewallet, cc
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState(null); // 'success', 'error', null
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [premiumEndDate, setPremiumEndDate] = useState(null);

  // CC Form state
  const [ccName, setCcName] = useState(user?.name || '');
  const [ccNumber, setCcNumber] = useState('');
  const [ccExpiry, setCcExpiry] = useState('');
  const [ccCvv, setCcCvv] = useState('');

  const basePrice = billing === 'yearly' ? 799000 : 99000;
  const discountAmount = (basePrice * discount) / 100;
  const finalPrice = basePrice - discountAmount;

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    try {
      const res = await axios.post('/subscription/apply-promo', { code: promoCode });
      if (res.data.valid) {
        setDiscount(res.data.discount);
        setPromoStatus('success');
      } else {
        setDiscount(0);
        setPromoStatus('error');
      }
    } catch (err) {
      setPromoStatus('error');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const res = await axios.post('/subscription/activate-premium', {
        paymentMethod: method,
        promoCode: promoStatus === 'success' ? promoCode : null,
        billingType: billing
      });

      if (res.data.success) {
        setPremiumEndDate(new Date(res.data.premiumEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
        setSuccess(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Update local user state
        updateUser({ plan: 'premium', premiumEndDate: res.data.premiumEndDate });
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-green-500" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Pembayaran Berhasil! 🎉</h2>
          <p className="text-gray-500 mb-8">Selamat! Premium kamu sudah aktif.</p>
          
          <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100">
            <div className="flex justify-between mb-3">
              <span className="text-sm text-gray-500">Plan</span>
              <span className="text-sm font-bold text-gray-900">BizBuddy Premium</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-sm text-gray-500">Berlaku hingga</span>
              <span className="text-sm font-bold text-gray-900">{premiumEndDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Email konfirmasi</span>
              <span className="text-sm font-bold text-gray-900">{user?.email}</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-full transition-all shadow-lg shadow-primary/30"
          >
            Kembali ke Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 md:p-8">
      <div className="max-w-5xl w-full flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative">
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 z-50 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full md:hidden"
        >
          <X size={20} />
        </button>

        {/* LEFT SIDE - SUMMARY */}
        <div className="w-full md:w-[40%] bg-[#0f2057] p-8 md:p-10 text-white flex flex-col">
          <div className="flex items-center space-x-2 mb-10">
            <span className="text-2xl">🤖</span>
            <span className="font-bold text-xl">BizBuddy <span className="text-orange-400">AI</span></span>
          </div>

          <h2 className="text-xl font-bold text-white mb-6">Ringkasan Pesanan</h2>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center">
              ⭐ BizBuddy Premium
            </h3>
            
            <div className="flex items-center justify-between mb-4 bg-white/5 p-1 rounded-lg">
              <button 
                onClick={() => setBilling('monthly')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${billing === 'monthly' ? 'bg-white text-gray-900' : 'text-white/70'}`}
              >
                Bulanan
              </button>
              <button 
                onClick={() => setBilling('yearly')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${billing === 'yearly' ? 'bg-white text-gray-900' : 'text-white/70'}`}
              >
                Tahunan
              </button>
            </div>

            <div className="mb-2">
              <span className="text-3xl font-black">Rp {billing === 'yearly' ? '799.000' : '99.000'}</span>
              <span className="text-sm text-white/70 font-medium">/{billing === 'yearly' ? 'tahun' : 'bulan'}</span>
            </div>
            
            {billing === 'yearly' && (
              <span className="inline-block bg-green-500/20 text-green-300 text-xs font-bold px-2 py-1 rounded-md mb-2 border border-green-500/30">
                Hemat Rp 389.000!
              </span>
            )}
          </div>

          <hr className="border-white/10 mb-6" />

          <ul className="space-y-3 mb-8 flex-1">
            {['Semua fitur Premium', 'AI unlimited (chat, review, report)', 'Export PDF & Excel', 'Prediksi stok AI', 'Support prioritas'].map((f, i) => (
              <li key={i} className="flex items-start text-sm text-white/80">
                <Check size={16} className="text-green-400 mr-3 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <hr className="border-white/10 mb-6" />

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-white/70 text-sm">
              <span>Subtotal</span>
              <span>Rp {basePrice.toLocaleString('id-ID')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-400 text-sm font-bold">
                <span>Diskon Promo ({discount}%)</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-black text-xl pt-2">
              <span>Total</span>
              <span>Rp {finalPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex items-center justify-center text-white/50 text-xs mt-auto">
            <Shield size={14} className="mr-1.5" />
            Pembayaran Aman & Terenkripsi
          </div>
        </div>

        {/* RIGHT SIDE - PAYMENT FORM */}
        <div className="w-full md:w-[60%] p-8 md:p-12 relative h-full">
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full hidden md:block"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-black text-gray-900 mb-8">Informasi Pembayaran</h2>

          <form onSubmit={handlePaymentSubmit} className="flex flex-col h-full">
            
            {/* Method Tabs */}
            <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'transfer', label: 'Transfer Bank' },
                { id: 'ewallet', label: 'E-Wallet' },
                { id: 'cc', label: 'Kartu Kredit/Debit' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${method === m.id ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Content Based on Method */}
            <div className="mb-8 flex-1 min-h-[250px]">
              
              {/* Transfer Bank */}
              {method === 'transfer' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="border-2 border-primary bg-orange-50/50 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full"></div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-8 bg-white border border-gray-200 rounded flex items-center justify-center font-bold text-blue-800 text-sm italic">BCA</div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Bank BCA</p>
                          <p className="font-bold text-gray-900">BizBuddy AI Indonesia</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <span className="font-mono font-bold text-lg text-gray-800 tracking-wider">1234 5678 90</span>
                      <button 
                        type="button"
                        onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="flex items-center space-x-1 text-primary text-sm font-bold px-3 py-1.5 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copied ? 'Disalin!' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-primary hover:bg-orange-50/30 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-gray-50 group-hover:bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <CreditCard size={20} className="text-gray-400 group-hover:text-primary" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">Drag & drop atau klik untuk upload</p>
                    <p className="text-xs text-gray-400 mt-1">Accept: .jpg, .png, .pdf</p>
                  </div>
                </div>
              )}

              {/* E-Wallet */}
              {method === 'ewallet' && (
                <div className="animate-in fade-in flex flex-col items-center justify-center py-6">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-6 shadow-inner border border-gray-200">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">QR Code</span>
                  </div>
                  <p className="text-center font-bold text-gray-700 mb-1">Scan QR code di atas</p>
                  <p className="text-center text-sm text-gray-500">Mendukung GoPay, OVO, DANA, dan ShopeePay.</p>
                </div>
              )}

              {/* Credit Card */}
              {method === 'cc' && (
                <div className="space-y-5 animate-in fade-in">
                  {/* Live CC Preview - Hidden on mobile to save space */}
                  <div className="hidden sm:block w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full -ml-8 -mb-8 blur-xl"></div>
                    
                    <div className="flex justify-between items-start h-full flex-col relative z-10">
                      <div className="w-12 h-8 bg-yellow-200/80 rounded-md"></div>
                      <div className="w-full">
                        <div className="font-mono text-xl tracking-widest mb-4 h-7">{ccNumber || 'XXXX XXXX XXXX XXXX'}</div>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Card Holder</p>
                            <p className="font-medium text-sm truncate w-48 h-5">{ccName || 'NAMA LENGKAP'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1 text-right">Expires</p>
                            <p className="font-medium text-sm h-5">{ccExpiry || 'MM/YY'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nomor Kartu</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      value={ccNumber}
                      onChange={(e) => setCcNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Masa Berlaku</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        value={ccExpiry}
                        onChange={(e) => setCcExpiry(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CVV</label>
                      <input 
                        type="password" 
                        placeholder="•••" 
                        value={ccCvv}
                        onChange={(e) => setCcCvv(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Promo Code Section */}
            <div className="mb-8 border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
              <button 
                type="button"
                onClick={() => setShowPromoInput(!showPromoInput)}
                className="flex items-center text-sm font-bold text-gray-700 hover:text-primary transition-colors"
              >
                Punya kode promo?
                {showPromoInput ? <ChevronDown size={16} className="ml-1" /> : <ChevronRight size={16} className="ml-1" />}
              </button>
              
              {showPromoInput && (
                <div className="mt-3 flex space-x-2 animate-in slide-in-from-top-2">
                  <input 
                    type="text" 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Masukkan kode (contoh: UMKM2024)"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none uppercase"
                  />
                  <button 
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors"
                  >
                    Terapkan
                  </button>
                </div>
              )}
              {promoStatus === 'success' && <p className="text-xs font-bold text-green-500 mt-2">Kode promo berhasil diterapkan!</p>}
              {promoStatus === 'error' && <p className="text-xs font-bold text-red-500 mt-2">Kode promo tidak valid atau kadaluarsa.</p>}
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-black py-4 rounded-full transition-all shadow-lg shadow-primary/30 flex justify-center items-center mt-auto group disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses pembayaran...
                </span>
              ) : (
                <>Konfirmasi Pembayaran <ChevronRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Payment;
