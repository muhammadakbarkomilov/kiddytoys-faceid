import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDashboard } from '../hooks/useDashboard';
import { ENDPOINTS } from '../utils/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const router = useRouter();
  const { loginSuccess } = useDashboard();

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!router.isReady) return;
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.replace('/');
    }
  }, [router.isReady, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.detail || 'Login failed');
      }

      // Save to context and localStorage instantly to prevent flashing
      loginSuccess(res.data.access_token, res.data.admin, String(res.data.expiry_date));
      
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Serverga ulanib boʻlmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4 select-none antialiased">
      {/* Login Card */}
      <div className="w-full max-w-[340px] bg-zinc-950/30 border border-zinc-800/80 backdrop-blur-md rounded-xl p-6 shadow-2xl animate-fadeIn space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight font-sans">Tizimga kirish</h1>
        </div>

        {error && (
          <div className="bg-rose-500/5 border border-rose-500/10 text-rose-450 text-xs px-3.5 py-2.5 rounded-md text-center font-medium animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-350">Login</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#09090b] border border-zinc-800 focus:border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-zinc-200 placeholder-zinc-700 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-350">Parol</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-zinc-500 hover:text-zinc-350 transition-colors focus:outline-none cursor-pointer font-medium"
                style={{ color: 'var(--brand-blue)' }}
              >
                Parolni unutdingizmi?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parol"
                className="w-full bg-[#09090b] border border-zinc-800 focus:border-zinc-300 rounded-lg pl-9 pr-10 py-2 text-zinc-200 placeholder-zinc-700 text-sm focus:outline-none transition-colors"
              />
              {/* Show/Hide password toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-350 transition-colors focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 px-4 rounded-lg text-white font-bold bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-center text-sm transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--brand-blue)', color: 'var(--text-on-brand)' }}
          >
            {loading ? 'KIRISH AMALGA OSHIRILMOQDA...' : 'Tizimga kirish'}
          </button>
        </form>
      </div>

      {/* Forgot Password Security Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-[340px] bg-black border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <h3 className="text-sm font-bold text-zinc-200">Parolni tiklash</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-zinc-500 hover:text-zinc-350 transition-colors focus:outline-none cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Xavfsizlik yuzasidan parolni faqat admin tiklay oladi. Iltimos, quyidagi raqamga bogʻlaning:
              </p>
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-3 text-center">
                <a
                  href="tel:+998933710800"
                  className="font-mono text-sm font-bold hover:underline select-text tracking-wide block"
                  style={{ color: 'var(--brand-blue)' }}
                >
                  +998 93 371 08 00
                </a>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-semibold transition-colors focus:outline-none cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
