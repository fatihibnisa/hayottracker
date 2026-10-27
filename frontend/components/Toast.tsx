'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type Toast = { id: number; message: string; isError: boolean };
type ToastCtx = (message: string, isError?: boolean) => void;

const Ctx = createContext<ToastCtx>(() => {});

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, isError = false) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, isError }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`glass animate-fade-in rounded-2xl px-5 py-3 text-sm font-medium shadow-glass ${
              t.isError ? 'text-red-600' : 'text-[var(--text-primary)]'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
