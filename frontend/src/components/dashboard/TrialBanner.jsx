import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, Clock, X } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import axios from 'axios';

const TrialBanner = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [daysLeft, setDaysLeft] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed today
    const lastDismissed = localStorage.getItem('trialBannerDismissed');
    if (lastDismissed) {
      const dismissDate = new Date(lastDismissed);
      const today = new Date();
      if (dismissDate.toDateString() === today.toDateString()) {
        setDismissed(true);
      }
    }

    if (user && user.plan === 'trial') {
      // Calculate from frontend if missing from backend headers, though we usually rely on backend
      const now = new Date();
      const end = new Date(user.trialEndDate);
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff > 0 ? diff : 0);
    }
  }, [user]);

  if (!user || user.plan !== 'trial' || daysLeft === null || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem('trialBannerDismissed', new Date().toISOString());
    setDismissed(true);
  };

  let config = {
    bg: 'bg-gradient-to-r from-orange-400 to-amber-500',
    icon: <Sparkles className="text-white mr-3 shrink-0" size={24} />,
    title: `✨ Kamu sedang menikmati Premium Trial! Sisa ${daysLeft} hari \u2022 Upgrade sekarang dan hemat lebih banyak`,
    btnText: 'Lihat Plan',
    btnClass: 'border-2 border-white/80 hover:bg-white hover:text-orange-500 text-white'
  };

  if (daysLeft <= 7 && daysLeft > 1) {
    config = {
      bg: 'bg-gradient-to-r from-amber-500 to-yellow-600',
      icon: <Clock className="text-white mr-3 shrink-0" size={24} />,
      title: `\u26A0\uFE0F Trial Premium kamu tersisa ${daysLeft} hari! Upgrade sekarang agar fitur tidak terkunci.`,
      btnText: 'Upgrade Sekarang',
      btnClass: 'bg-white text-amber-600 hover:bg-orange-50'
    };
  } else if (daysLeft <= 1) {
    config = {
      bg: 'bg-gradient-to-r from-red-500 to-rose-600',
      icon: <AlertTriangle className="text-white mr-3 shrink-0" size={24} />,
      title: `\uD83D\uDEA8 Ini hari terakhir Premium Trial kamu! Upgrade hari ini untuk tetap akses semua fitur.`,
      btnText: 'Upgrade Sekarang!',
      btnClass: 'bg-white text-red-600 font-bold hover:bg-red-50 shadow-lg'
    };
  }

  return (
    <div className={`${config.bg} rounded-xl p-4 shadow-md mb-6 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
      
      <div className="flex items-center text-white z-10 w-full pr-8 sm:pr-0 mb-3 sm:mb-0">
        {config.icon}
        <p className="font-medium text-sm sm:text-base leading-snug">
          {config.title}
        </p>
      </div>

      <div className="flex items-center shrink-0 z-10 w-full sm:w-auto">
        <button 
          onClick={() => navigate('/dashboard/upgrade')}
          className={`w-full sm:w-auto px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${config.btnClass}`}
        >
          {config.btnText}
        </button>
      </div>

      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
        aria-label="Tutup banner"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default TrialBanner;
