import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Package, Star, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/useAuthStore';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      return setError('Password minimal 8 karakter');
    }
    if (password !== confirmPassword) {
      return setError('Password tidak cocok');
    }
    if (!terms) {
      return setError('Anda harus menyetujui syarat & ketentuan');
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/auth/register', { name, email, password });
      setAuth(res.data, res.data.token);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/auth/google', { 
        credential: credentialResponse.credential 
      });
      setAuth(res.data, res.data.token);
      if (res.data.isOnboardingComplete) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError('Pendaftaran via Google gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-secondary to-primary relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent blur-3xl"></div>
      </div>

      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative z-10">
        <div className="relative z-10">
          <div className="flex items-center space-x-2">
            <span className="text-4xl">🤖</span>
            <span className="font-bold text-2xl text-white">BizBuddy <span className="text-accent">AI</span></span>
          </div>
          
          <div className="mt-24">
            <h1 className="text-white text-5xl font-bold leading-tight">
              Kelola Bisnis<br/>Lebih Cerdas dengan AI
            </h1>
            <p className="text-white/80 mt-6 text-lg max-w-md">
              Order, Review, Stok - semua dalam satu dashboard. Solusi UMKM modern untuk berkembang lebih cepat tanpa repot.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-16">
            <div className="bg-black/20 backdrop-blur-md rounded-full py-2 px-4 flex items-center text-white text-sm border border-white/10">
              <Package size={16} className="mr-2" /> Order Terpusat
            </div>
            <div className="bg-black/20 backdrop-blur-md rounded-full py-2 px-4 flex items-center text-white text-sm border border-white/10">
              <Star size={16} className="mr-2" /> Kelola Review
            </div>
            <div className="bg-black/20 backdrop-blur-md rounded-full py-2 px-4 flex items-center text-white text-sm border border-white/10">
              <TrendingUp size={16} className="mr-2" /> Auto Stok AI
            </div>
          </div>
        </div>
        
        <div className="text-white/60 text-sm relative z-10">
          © 2026 BizBuddy AI. Hak cipta dilindungi.
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 overflow-y-auto">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/50 my-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-secondary">Buat Akun Baru</h2>
            <p className="text-gray-500 mt-2">Daftar sekarang untuk memulai dengan gratis</p>
          </div>

          {error && (
            <div className="bg-red-50 text-danger p-3 rounded-lg text-sm mb-4 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Budi Santoso"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="mb-6 flex items-start">
              <div className="flex items-center h-5">
                <input 
                  id="terms" 
                  type="checkbox" 
                  checked={terms}
                  onChange={(e) => setTerms(e.target.value === 'on' || e.target.checked)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2" 
                />
              </div>
              <label htmlFor="terms" className="ml-2 text-sm font-medium text-gray-700">
                Saya setuju dengan <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center group disabled:opacity-70 shadow-lg shadow-primary/20"
            >
              {loading ? 'Memproses...' : (
                <>
                  Daftar Sekarang <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="h-px bg-gray-200 w-full"></div>
            <span className="text-gray-400 text-sm font-medium">ATAU</span>
            <div className="h-px bg-gray-200 w-full"></div>
          </div>

          <div className="flex justify-center mt-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login dibatalkan atau gagal')}
              shape="rectangular"
              size="large"
              width="100%"
              logo_alignment="center"
              text="signup_with"
            />
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Sudah punya akun? <Link to="/login" className="text-secondary font-medium hover:underline">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
