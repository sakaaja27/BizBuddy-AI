import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Reviews from './pages/Reviews';
import AiAssistant from './pages/AiAssistant';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Finance from './pages/Finance';
import Upgrade from './pages/Upgrade';
import Payment from './pages/Payment';
import Settings from './pages/Settings';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import UpgradeModal from './components/shared/UpgradeModal';
import TrialExpiredOverlay from './components/shared/TrialExpiredOverlay';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/useAuthStore';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Interceptor to always attach token to every request before it is sent
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const App = () => {
  const { token, updateUser, logout } = useAuthStore();
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: null, limit: null });
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (token) {
      axios.get('/auth/me')
        .then(res => updateUser(res.data))
        .catch(() => logout());
    }
  }, [token, updateUser, logout]);

  // Global interceptor to show UpgradeModal when limit is hit
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => {
        if (res.headers && res.headers['x-trial-expired']) {
          setTrialExpired(true);
        }
        return res;
      },
      (error) => {
        if (error.response?.headers && error.response.headers['x-trial-expired']) {
          setTrialExpired(true);
        }
        if (error.response?.status === 403 && error.response?.data?.error === 'LIMIT_REACHED') {
          const { feature, limit } = error.response.data;
          setUpgradeModal({ isOpen: true, feature, limit });
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <GoogleOAuthProvider clientId="92963289843-33qgg4dats40jl6mbvlfru5oi1usec6b.apps.googleusercontent.com">
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <UpgradeModal
          isOpen={upgradeModal.isOpen}
          feature={upgradeModal.feature}
          limit={upgradeModal.limit}
          onClose={() => setUpgradeModal({ isOpen: false, feature: null, limit: null })}
        />
        <TrialExpiredOverlay isOpen={trialExpired} onClose={() => setTrialExpired(false)} />
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute requireOnboarding={false}>
              <Onboarding />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/orders" 
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/inventory" 
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/reviews" 
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/ai-assistant" 
          element={
            <ProtectedRoute>
              <AiAssistant />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/analytics" 
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/finance" 
          element={
            <ProtectedRoute>
              <Finance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upgrade" 
          element={<Upgrade standalone={true} />} 
        />
        <Route 
          path="/dashboard/upgrade" 
          element={
            <ProtectedRoute>
              <Upgrade />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment" 
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/help" 
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } 
        />
        <Route path="/server-error" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

export default App;
