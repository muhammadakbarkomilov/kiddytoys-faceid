import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove toast from state after animation completes (400ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 400);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 3000);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-6 right-6 z-[9999] max-w-sm w-full pointer-events-none min-h-[160px]">
        {toasts.map((toast, index) => {
          const indexFromEnd = toasts.length - 1 - index;
          const isVisible = indexFromEnd < 4;
          if (!isVisible) return null;

          const translateY = indexFromEnd * 10;
          const scale = 1 - indexFromEnd * 0.05;
          const opacity = toast.exiting ? 0 : 1 - indexFromEnd * 0.18;
          const zIndex = 1000 - indexFromEnd;
          const translateX = toast.exiting ? 80 : 0;

          return (
            <div
              key={toast.id}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100%',
                transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                opacity,
                zIndex,
                transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border shadow-2xl font-sans text-xs font-semibold ${
                !toast.exiting && indexFromEnd === 0 ? 'animate-toastSlideIn' : ''
              } ${
                toast.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-200 backdrop-blur-md'
                  : toast.type === 'error'
                  ? 'bg-rose-950/95 border-rose-500/30 text-rose-200 backdrop-blur-md'
                  : 'bg-zinc-900/95 border-zinc-800 text-zinc-200 backdrop-blur-md'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === 'success' && (
                  <svg className="w-4 h-4 text-emerald-450 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="w-4 h-4 text-rose-450 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="w-4 h-4 text-blue-450 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="leading-relaxed">{toast.message}</span>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none shrink-0"
              >
                <svg className="w-4 h-4 opacity-50 hover:opacity-90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
