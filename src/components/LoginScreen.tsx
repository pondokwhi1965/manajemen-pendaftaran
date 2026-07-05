import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { User as UserType, AppSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  usersList: UserType[];
  onLoginSuccess: (user: UserType) => void;
  onBackToHome: () => void;
  appSettings: AppSettings;
}

export function LoginScreen({ usersList, onLoginSuccess, onBackToHome, appSettings }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Harap isi username dan kata sandi Anda.');
      return;
    }

    setLoading(true);

    // Simulate standard network latency for a polished look
    setTimeout(() => {
      const foundUser = usersList.find(
        u => u.username.toLowerCase() === username.toLowerCase().trim()
      );

      if (!foundUser) {
        setError('Username tidak terdaftar dalam sistem.');
        setLoading(false);
        return;
      }

      // Check if account is active
      if (foundUser.isActive === false) {
        setError('Gagal: Akun Anda telah dinonaktifkan oleh administrator.');
        setLoading(false);
        return;
      }

      // Check password (fallback to default if not set)
      const correctPassword = foundUser.password || `${foundUser.username}123`;
      if (password !== correctPassword) {
        setError('Kata sandi yang Anda masukkan salah.');
        setLoading(false);
        return;
      }

      // Success
      setLoading(false);
      onLoginSuccess(foundUser);
    }, 600);
  };

  const renderLogo = () => {
    if (appSettings.logoUrl) {
      return (
        <img 
          src={appSettings.logoUrl} 
          alt="Logo" 
          className="w-full h-full object-contain p-1"
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 2C8 6 8 11 12 15C16 11 16 6 12 2Z" fill="currentColor" />
        <path d="M4 22V14C4 12 6 10 12 10C18 10 20 12 20 14V22" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Back Button */}
        <motion.button
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onBackToHome}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all">
            <ArrowLeft size={14} />
          </div>
          Kembali ke Beranda
        </motion.button>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden ${appSettings.logoUrl ? 'bg-white' : 'bg-emerald-600 text-white'}`}
          >
            {renderLogo()}
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Sistem Manajemen Pendaftaran</h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">{appSettings.pondokName}</p>
          </div>
        </div>

        {/* Login Form Container */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
        >
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Masuk Aplikasi</h2>
            <p className="text-xs text-slate-500">Gunakan akun staf terdaftar Anda untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 p-3.5 rounded-2xl text-xs font-medium text-red-600 flex items-start gap-2 overflow-hidden"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Username Staf</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username (contoh: admin)"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Kata Sandi (Password)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <span>Masuk Aplikasi</span>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
