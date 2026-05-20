import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Package, Star, TrendingUp } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/useAuthStore';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/auth/login', { email, password });
      setAuth(res.data, res.data.token);
      if (res.data.isOnboardingComplete) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan');
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
      setError('Login Google gagal');
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
            <button className="mt-8 bg-primary hover:bg-orange-600 text-white font-medium py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30">
              Mulai Gratis Sekarang
            </button>
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-secondary">Selamat Datang</h2>
            <p className="text-gray-500 mt-2">Masuk untuk melanjutkan ke Dashboard</p>
          </div>

          {error && (
            <div className="bg-red-50 text-danger p-3 rounded-lg text-sm mb-4 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
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

            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-sm text-primary hover:text-orange-600 font-medium">Lupa?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-secondary hover:bg-blue-900 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center group disabled:opacity-70"
            >
              {loading ? 'Memproses...' : (
                <>
                  Masuk <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
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
              text="continue_with"
            />
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Belum punya akun? <Link to="/register" className="text-primary font-medium hover:underline">Daftar sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
