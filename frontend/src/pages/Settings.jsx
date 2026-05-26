import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Store, Bell, Shield, CreditCard, Trash2, Camera, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useAuthStore from '../store/useAuthStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profil');
  const [loading, setLoading] = useState(false);

  // Profil Form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Toko Form
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessType, setBusinessType] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications
  const [notifState, setNotifState] = useState({
    pushOrder: true, pushStock: true, pushReview: true, pushReport: true,
    emailSummary: true, emailStock: true, emailTips: false
  });

  // Delete Account
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [subscription, setSubscription] = useState({ plan: 'free', trialDaysLeft: 0, trialEndDate: null, premiumEndDate: null });

  useEffect(() => {
    // Fetch business and subscription data
    const fetchData = async () => {
      try {
        const [subRes, meRes] = await Promise.all([
          axios.get('/subscription/status'),
          axios.get('/auth/me') // re-fetch me to get full business data if we attached it
        ]);
        setSubscription(subRes.data);
        
        if (meRes.data) {
          if (meRes.data.businessType) setBusinessType(meRes.data.businessType);
          if (meRes.data.city) setCity(meRes.data.city);
          if (meRes.data.description) setDescription(meRes.data.description);
          if (meRes.data.address) setAddress(meRes.data.address);
          
          // Also update name, email, phone in case they were updated
          if (meRes.data.name) setName(meRes.data.name);
          if (meRes.data.email) setEmail(meRes.data.email);
          if (meRes.data.phone) setPhone(meRes.data.phone);
          if (meRes.data.businessName) setBusinessName(meRes.data.businessName);
        }
      } catch (err) {
        console.error('Failed to fetch settings data');
      }
    };
    fetchData();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put('/users/profile', { name, email, phone });
      updateUser(res.data.user);
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error('Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handleTokoSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put('/users/business', { businessName, businessType, city, description, address });
      updateUser({ 
        businessName: res.data.business.businessName,
        businessType: res.data.business.businessType,
        city: res.data.business.city,
        description: res.data.business.description,
        address: res.data.business.address
      });
      toast.success('Profil toko berhasil diperbarui');
    } catch (err) {
      toast.error('Gagal memperbarui profil toko');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Konfirmasi password tidak cocok');
    }
    setLoading(true);
    try {
      await axios.put('/users/password', { currentPassword, newPassword });
      toast.success('Password berhasil diubah');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifSave = async () => {
    setLoading(true);
    try {
      await axios.put('/users/notifications', notifState);
      toast.success('Preferensi notifikasi disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'HAPUS') return;
    if (window.confirm('PERINGATAN AKHIR: Apakah Anda yakin ingin menghapus akun ini secara permanen?')) {
      try {
        await axios.delete('/users/account');
        logout();
        navigate('/');
      } catch (err) {
        toast.error('Gagal menghapus akun');
      }
    }
  };

  const tabs = [
    { id: 'profil', label: 'Profil Akun', icon: <User size={18} /> },
    { id: 'toko', label: 'Profil Toko', icon: <Store size={18} /> },
    { id: 'keamanan', label: 'Keamanan', icon: <Shield size={18} /> },
    { id: 'billing', label: 'Plan & Billing', icon: <CreditCard size={18} /> },
    { id: 'hapus', label: 'Hapus Akun', icon: <Trash2 size={18} />, danger: true },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Pengaturan</h1>
          <p className="text-gray-500">Kelola profil dan preferensi akun bisnis kamu</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* LEFT MENU */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 overflow-x-auto md:overflow-visible flex md:flex-col gap-1 sticky top-24 scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? (tab.danger ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-primary border-l-4 border-primary') 
                      : (tab.danger ? 'text-red-400 hover:bg-red-50/50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900')
                  }`}
                  style={activeTab === tab.id && !tab.danger ? { borderLeftWidth: '4px' } : { borderLeftWidth: '4px', borderColor: 'transparent' }}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 min-h-[500px]">
            
            {/* PROFIL AKUN */}
            {activeTab === 'profil' && (
              <div className="animate-in fade-in">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Profil Akun</h2>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                      {user?.name?.charAt(0).toUpperCase() || 'B'}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-500 hover:text-primary transition-colors">
                      <Camera size={16} />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-bold text-gray-900 text-lg">{user?.name}</h3>
                    <p className="text-gray-500 text-sm mb-3">{user?.email}</p>
                    <p className="text-xs text-gray-400">Format gambar: JPG, PNG. Maksimal 2MB.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSave} className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nomor WhatsApp</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081234567890" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-md mt-4">
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </form>
              </div>
            )}

            {/* PROFIL TOKO */}
            {activeTab === 'toko' && (
              <div className="animate-in fade-in">
                <h2 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-4">Profil Toko</h2>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-blue-800">Pastikan data toko ini akurat. AI BizBuddy menggunakan data ini untuk memberikan saran, prediksi, dan draf balasan yang relevan dengan bisnismu.</p>
                </div>

                <form onSubmit={handleTokoSave} className="max-w-2xl space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nama Toko/Bisnis</label>
                      <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Bisnis</label>
                      <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white">
                        <option value="">Pilih...</option>
                        <option value="fnb">Kuliner (F&B)</option>
                        <option value="retail">Retail / Fashion</option>
                        <option value="service">Jasa</option>
                        <option value="other">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Kota / Kabupaten</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Singkat Bisnis</label>
                    <textarea 
                      value={description} 
                      onChange={e => setDescription(e.target.value)}
                      rows={3} 
                      maxLength={200}
                      placeholder="contoh: Warung makan yang menyajikan masakan rumahan khas Jawa dengan harga terjangkau di Surabaya."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" 
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/200</p>
                  </div>

                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-md">
                    {loading ? 'Menyimpan...' : 'Simpan Profil Toko'}
                  </button>
                </form>
              </div>
            )}

            {/* KEAMANAN */}
            {activeTab === 'keamanan' && (
              <div className="animate-in fade-in max-w-md">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Keamanan Akun</h2>
                
                <form onSubmit={handlePasswordSave} className="space-y-4 mb-8">
                  <h3 className="font-bold text-gray-900 text-sm mb-2">Ubah Password</h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Password Saat Ini</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Password Baru</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" required minLength={8} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Konfirmasi Password Baru</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" required minLength={8} />
                  </div>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-md mt-2">
                    Ubah Password
                  </button>
                </form>

                <hr className="border-gray-100 mb-6" />

                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-4">Sesi Aktif</h3>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-gray-900 flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Perangkat Ini (Windows / Chrome)</p>
                      <p className="text-xs text-gray-500 mt-0.5 ml-4">Jakarta, Indonesia • Sedang aktif</p>
                    </div>
                  </div>
                  <button className="text-sm font-bold text-red-500 mt-3 hover:underline">Logout Semua Perangkat Lain</button>
                </div>
              </div>
            )}

            {/* PLAN & BILLING */}
            {activeTab === 'billing' && (
              <div className="animate-in fade-in max-w-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Plan & Billing</h2>
                
                <div className={`rounded-2xl p-6 mb-8 border-2 ${subscription.plan === 'trial' ? 'bg-orange-50/50 border-orange-200' : subscription.plan === 'premium' ? 'bg-gradient-to-br from-[#0f2057] to-[#1a3580] text-white border-transparent' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block ${subscription.plan === 'trial' ? 'bg-orange-100 text-orange-600' : subscription.plan === 'premium' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' : 'bg-gray-200 text-gray-500'}`}>
                        {subscription.plan === 'trial' ? 'PREMIUM TRIAL' : subscription.plan === 'premium' ? '⭐ PREMIUM' : 'GRATIS'}
                      </span>
                      <h3 className={`text-2xl font-black ${subscription.plan === 'premium' ? 'text-white' : 'text-gray-900'}`}>
                        BizBuddy {subscription.plan === 'premium' ? 'Premium' : subscription.plan === 'trial' ? 'Trial' : 'Gratis'}
                      </h3>
                    </div>
                    {subscription.plan === 'trial' && (
                      <div className="text-right">
                        <div className="text-2xl font-black text-orange-500">{subscription.trialDaysLeft}</div>
                        <div className="text-xs text-orange-400 font-bold uppercase">hari tersisa</div>
                      </div>
                    )}
                  </div>

                  {subscription.plan === 'trial' && (
                    <div className="mb-6">
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Trial digunakan</span>
                        <span>{30 - subscription.trialDaysLeft} dari 30 hari</span>
                      </div>
                      <div className="w-full bg-orange-100 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${((30 - subscription.trialDaysLeft) / 30) * 100}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {subscription.plan !== 'premium' ? (
                      <button onClick={() => navigate('/payment?billing=monthly')} className="px-6 py-3 bg-primary hover:bg-orange-600 text-white font-black rounded-full transition-all shadow-lg">
                        Upgrade ke Premium
                      </button>
                    ) : (
                      <button onClick={() => navigate('/payment?billing=yearly')} className="px-6 py-3 border border-white/30 hover:bg-white/10 text-white font-bold rounded-full transition-colors">
                        Perpanjang Plan
                      </button>
                    )}
                  </div>
                </div>

                {subscription.plan === 'premium' && (
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-4">Riwayat Pembayaran</h3>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                          <tr>
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">Deskripsi</th>
                            <th className="px-4 py-3">Jumlah</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="px-4 py-3 font-medium text-gray-900">20 Mei 2026</td>
                            <td className="px-4 py-3 text-gray-500">Upgrade Premium (Bulanan)</td>
                            <td className="px-4 py-3 font-bold text-gray-900">Rp 99.000</td>
                            <td className="px-4 py-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Berhasil</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HAPUS AKUN */}
            {activeTab === 'hapus' && (
              <div className="animate-in fade-in max-w-md">
                <h2 className="text-xl font-black text-red-600 mb-2">Hapus Akun Permanen</h2>
                <p className="text-sm text-gray-500 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
                
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
                  <AlertTriangle className="text-red-500 mb-3" size={24} />
                  <p className="text-sm text-red-800 font-medium mb-2">Menghapus akun berarti:</p>
                  <ul className="list-disc list-inside text-sm text-red-700/80 space-y-1 mb-4">
                    <li>Semua data profil dan toko terhapus permanen</li>
                    <li>Riwayat pesanan dan analitik akan hilang</li>
                    <li>Sisa masa aktif Premium (jika ada) akan hangus</li>
                  </ul>
                  
                  <label className="block text-sm font-bold text-red-900 mb-1">Ketik 'HAPUS' untuk konfirmasi</label>
                  <input 
                    type="text" 
                    value={deleteConfirm} 
                    onChange={e => setDeleteConfirm(e.target.value)} 
                    placeholder="HAPUS"
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white" 
                  />
                </div>

                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'HAPUS'} 
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hapus Akun Saya Permanen
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
