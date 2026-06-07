import React, { useEffect, useState, useRef } from 'react';
import { useToast } from './ToastContext';

// Augment global Window interface for TypeScript safety
declare global {
  interface Window {
    __DEVTOOLS_OPEN__?: boolean;
    __FETCH_PATCHED__?: boolean;
  }
}

// Module-level detection logic (runs immediately on script load in browser)
if (typeof window !== 'undefined') {
  // Safe threshold (250px) to prevent false positives from standard macOS/Windows address/bookmark bars
  const threshold = 250;

  const checkSize = () => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    return widthDiff > threshold || heightDiff > threshold;
  };

  // Immediate synchronous size check on initial bundle load
  window.__DEVTOOLS_OPEN__ = checkSize();

  // Intercept and patch global window.fetch immediately during bundle import
  if (!window.__FETCH_PATCHED__) {
    window.__FETCH_PATCHED__ = true;
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      // If DevTools is detected, reject the fetch call instantly, blocking the request
      if (window.__DEVTOOLS_OPEN__) {
        return Promise.reject(new TypeError("Failed to fetch"));
      }
      return originalFetch.apply(this, args);
    };
  }
}

export default function SystemGuard() {
  const { showToast } = useToast();
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const previousOnline = useRef<boolean | null>(null);

  // 1. Monitor Internet connection status (online / offline)
  useEffect(() => {
    previousOnline.current = navigator.onLine;

    const handleOnline = () => {
      if (previousOnline.current === false) {
        showToast("Internet ulanishi tiklandi.", "success");
      }
      previousOnline.current = true;
    };

    const handleOffline = () => {
      showToast("Internet aloqasi uzildi. Ba'zi ma'lumotlar yuklanmasligi mumkin.", "error");
      previousOnline.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // 2. Continuous size check loop for DevTools opened/closed state (fully dynamic & self-healing)
  useEffect(() => {
    const threshold = 250;

    const checkSize = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      return widthDiff > threshold || heightDiff > threshold;
    };

    const checkAll = () => {
      const isDetected = checkSize();
      
      // Update both React state and global window variable dynamically
      setIsDevToolsOpen(isDetected);
      window.__DEVTOOLS_OPEN__ = isDetected;
    };

    // Listen to window resizing (closing/opening DevTools triggers this instantly)
    window.addEventListener('resize', checkAll);

    // Initial check on mount
    checkAll();

    // Check periodically every 1 second as a fallback
    const interval = setInterval(checkAll, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkAll);
    };
  }, []);

  if (!isDevToolsOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#09090b]/90 backdrop-blur-md z-[999999] flex items-center justify-center p-4 font-sans select-none animate-fadeIn pointer-events-auto">
      {/* Responsive Modal Container with dynamic border color */}
      <div 
        className="w-full max-w-[340px] sm:max-w-md bg-zinc-950 border rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4 sm:space-y-5 animate-scaleUp mx-4"
        style={{ borderColor: 'var(--brand-blue-hover, #27272a)' }}
      >
        <div className="space-y-2">
          {/* Dynamic header text matching active theme brand color */}
          <h3 
            className="text-sm sm:text-base font-extrabold tracking-tight uppercase"
            style={{ color: 'var(--brand-blue, #3b82f6)' }}
          >
            Tizim Xavfsizligi Cheklovi
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed px-2 sm:px-4">
            Xavfsizlik yuzasidan brauzer dasturchilar paneli (Developer Tools) ochilganda sayt faoliyati cheklanadi. Iltimos, panelni yoping va sahifani yangilang.
          </p>
        </div>
        
        <button
          onClick={() => {
            setIsDevToolsOpen(false);
            window.__DEVTOOLS_OPEN__ = false;
            window.location.reload();
          }}
          className="cf-btn-primary w-full py-2.5 px-4 text-xs font-bold transition-all shadow-md cursor-pointer focus:outline-none"
          style={{ backgroundColor: 'var(--brand-blue)', color: 'var(--text-on-brand)' }}
        >
          Sahifani yangilash
        </button>
      </div>
    </div>
  );
}
