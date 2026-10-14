import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const notify = useCallback((type, message) => {
    clearTimeout(timerRef.current);
    setToast({ type, message, id: Date.now() });
    // Pesan error dibiarkan lebih lama karena biasanya perlu dibaca sampai habis
    timerRef.current = setTimeout(() => setToast(null), type === 'error' ? 7000 : 4000);
  }, []);

  const dismiss = () => {
    clearTimeout(timerRef.current);
    setToast(null);
  };

  return (
    <ToastContext.Provider value={notify}>
      {children}

      {/* aria-live agar pembaca layar mengumumkan hasil simpan/hapus */}
      <div
        aria-live="polite"
        className="fixed inset-x-3 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6 pointer-events-none"
      >
        {toast && (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.type === 'error' ? 'bg-rose-700 text-white' : 'bg-[#0a4ea0] text-white'
            }`}
          >
            <svg
              className={`mt-0.5 h-5 w-5 shrink-0 ${toast.type === 'error' ? 'text-white' : 'text-[#f5c542]'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {toast.type === 'error' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              )}
            </svg>
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Tutup notifikasi"
              className="-my-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

