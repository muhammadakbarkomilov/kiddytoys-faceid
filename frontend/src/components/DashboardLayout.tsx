import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDashboard } from '../hooks/useDashboard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, currentAdmin, initialized, logout } = useDashboard();
  const router = useRouter();
  const pathname = router.pathname;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Route security check: redirect to login if not authenticated
  useEffect(() => {
    if (!router.isReady) return;
    const hasSavedToken = localStorage.getItem('auth_token');
    
    if (initialized && !token) {
      router.replace('/login');
    } else if (!hasSavedToken) {
      router.replace('/login');
    }
  }, [initialized, token, router.isReady, router]);

  // Dynamic brand colors injection from URL query params
  useEffect(() => {
    if (!router.isReady) return;
    const { color } = router.query;
    
    const palettes: Record<string, { brand: string; hover: string; textOnBrand?: string }> = {
      blue: { brand: '#60a5fa', hover: '#3b82f6', textOnBrand: '#09090b' },      // Soft Blue
      emerald: { brand: '#34d399', hover: '#10b981', textOnBrand: '#09090b' },   // Soft Emerald
      rose: { brand: '#fb7185', hover: '#f43f5e', textOnBrand: '#09090b' },      // Soft Rose
      violet: { brand: '#a78bfa', hover: '#8b5cf6', textOnBrand: '#09090b' },    // Soft Violet
      amber: { brand: '#fbbf24', hover: '#f59e0b', textOnBrand: '#09090b' },     // Soft Amber
      zinc: { brand: '#e4e4e7', hover: '#a1a1aa', textOnBrand: '#09090b' },      // Soft Zinc
    };

    const selectedColor = typeof color === 'string' && palettes[color] ? color : 'blue';
    const palette = palettes[selectedColor];

    const root = document.documentElement;
    root.style.setProperty('--brand-blue', palette.brand);
    root.style.setProperty('--brand-blue-hover', palette.hover);
    if (palette.textOnBrand) {
      root.style.setProperty('--text-on-brand', palette.textOnBrand);
    }
  }, [router.isReady, router.query.color]);

  // Preserving query parameters (e.g. ?color=...) on navigation
  const navigateWithQuery = useCallback((path: string) => {
    const query = { ...router.query };
    delete query.page; // Start back at page 1 on tab switches
    router.push({
      pathname: path,
      query: query,
    });
  }, [router]);

  // Prevent flash of content before session check completes
  if (!isMounted) {
    return <div className="min-h-screen bg-[#09090b]" />;
  }

  if (!initialized || !token) {

    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
    if (hasToken) {
      return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs text-zinc-500 animate-pulse">
          AUTENTIFIKATSIYA TEKSHIRILMOQDA...
        </div>
      );
    }
    return <div className="min-h-screen bg-[#09090b]" />;
  }

  // Sidebar item helper to check active state
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col font-sans select-none antialiased overflow-hidden">
      
      {/* 1. TOP HEADER */}
      <header className="h-14 border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateWithQuery('/')}>
            <span className="font-extrabold text-sm text-zinc-100 uppercase tracking-widest">Kiddy Toys</span>
          </div>
        </div>

        {/* Right Header Side: Profile Dropdown */}
        <div className="flex items-center gap-4 text-xs relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/40 transition-colors cursor-pointer focus:outline-none"
          >
            <span className="text-xs font-semibold text-zinc-300">
              {currentAdmin?.first_name} {currentAdmin?.last_name}
            </span>
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop click listener */}
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-40 py-2 animate-fadeIn select-none">
                <div className="px-4 py-2 border-b border-zinc-800/80 mb-1">
                  <div className="text-[12px] font-bold text-zinc-200">
                    {currentAdmin?.first_name} {currentAdmin?.last_name}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                    {currentAdmin?.username}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-zinc-800/50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                  </svg>
                  <span>Tizimdan chiqish</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 2. MAIN LAYOUT GRID */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-[245px] bg-[#09090b] border-r border-zinc-800/80 flex flex-col justify-between shrink-0 select-none">
          
          {/* Sidebar Top Menu */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <nav className="space-y-1 text-sm font-sans text-zinc-400">
              <button
                onClick={() => navigateWithQuery('/')}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-left cursor-pointer ${
                  isActive('/')
                    ? 'bg-zinc-800/50 text-zinc-150 font-semibold shadow-sm'
                    : 'hover:bg-zinc-900/50 hover:text-zinc-200'
                }`}
              >
                <svg
                  className={`w-4 h-4 transition-colors ${isActive('/') ? '' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                  style={isActive('/') ? { color: 'var(--brand-blue)' } : {}}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="whitespace-nowrap truncate">Dashboard</span>
              </button>

              <button
                onClick={() => navigateWithQuery('/employees')}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-left cursor-pointer ${
                  isActive('/employees')
                    ? 'bg-zinc-800/50 text-zinc-150 font-semibold shadow-sm'
                    : 'hover:bg-zinc-900/50 hover:text-zinc-200'
                }`}
              >
                <svg
                  className={`w-4 h-4 transition-colors ${isActive('/employees') ? '' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                  style={isActive('/employees') ? { color: 'var(--brand-blue)' } : {}}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="whitespace-nowrap truncate">Xodimlar</span>
              </button>

              <button
                onClick={() => navigateWithQuery('/positions')}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-left cursor-pointer ${
                  isActive('/positions')
                    ? 'bg-zinc-800/50 text-zinc-150 font-semibold shadow-sm'
                    : 'hover:bg-zinc-900/50 hover:text-zinc-200'
                }`}
              >
                <svg
                  className={`w-4 h-4 transition-colors ${isActive('/positions') ? '' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                  style={isActive('/positions') ? { color: 'var(--brand-blue)' } : {}}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="whitespace-nowrap truncate">Lavozimlar</span>
              </button>

              <button
                onClick={() => navigateWithQuery('/admins')}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-left cursor-pointer ${
                  isActive('/admins')
                    ? 'bg-zinc-800/50 text-zinc-150 font-semibold shadow-sm'
                    : 'hover:bg-zinc-900/50 hover:text-zinc-200'
                }`}
              >
                <svg
                  className={`w-4 h-4 transition-colors ${isActive('/admins') ? '' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                  style={isActive('/admins') ? { color: 'var(--brand-blue)' } : {}}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="whitespace-nowrap truncate">Adminlar</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* 3. MAIN WORKSPACE */}
        <main className="flex-1 bg-[#09090b]/40 p-8 overflow-y-auto relative animate-fadeIn">
          <div className="w-full space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
