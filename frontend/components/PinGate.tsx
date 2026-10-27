'use client';

import { useEffect, useState } from 'react';
import { Delete, Lock, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { useSettings } from '@/lib/settings-context';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

const STORAGE_KEY = 'hayot_pin_unlocked_at';

const TIMEOUT_MS: Record<string, number | null> = {
  immediate: null, // no extra timeout — relies on sessionStorage clearing when the app/tab closes
  '1m': 60 * 1000,
  '1h': 60 * 60 * 1000,
};

function isStillUnlocked(timeout: string): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ms = TIMEOUT_MS[timeout];
    if (ms == null) return true;
    return Date.now() - Number(raw) < ms;
  } catch {
    return false;
  }
}

export function PinGate({ children }: { children: React.ReactNode }) {
  const { settings, loaded, update } = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setUnlocked(isStillUnlocked(settings.pinLockTimeout));
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.pinLockTimeout]);

  useEffect(() => {
    if (!unlocked || settings.pinLockTimeout === 'immediate') return;
    const id = setInterval(() => {
      if (!isStillUnlocked(settings.pinLockTimeout)) setUnlocked(false);
    }, 5000);
    return () => clearInterval(id);
  }, [unlocked, settings.pinLockTimeout]);

  useEffect(() => {
    if (pin.length !== 4) return;
    setVerifying(true);
    api
      .post<{ valid: boolean }>('/api/settings/pin/verify', { pin })
      .then((res) => {
        if (res.valid) {
          try {
            sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
          } catch {}
          setUnlocked(true);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      })
      .finally(() => setVerifying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const locked = checked && settings.pinEnabled && !unlocked;
  useEffect(() => {
    if (!locked) return;
    function onKeyDown(e: KeyboardEvent) {
      if (verifying) return;
      if (e.key >= '0' && e.key <= '9') {
        setPin((p) => (p.length < 4 ? p + e.key : p));
      } else if (e.key === 'Backspace') {
        setPin((p) => p.slice(0, -1));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [locked, verifying]);

  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [locked]);

  async function handleResetPin() {
    setResetting(true);
    try {
      await api.post('/api/settings/pin/reset', {});
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      setForgotOpen(false);
      setUnlocked(true);
      update({ pinEnabled: false });
    } finally {
      setResetting(false);
    }
  }

  if (!loaded || !checked) return null;
  if (!settings.pinEnabled || unlocked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-xl" />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 px-6">
        <div className="text-center">
          <div className="text-6xl font-light tabular-nums text-white drop-shadow-lg">
            {pad2(now.getHours())}:{pad2(now.getMinutes())}
          </div>
          <div className="mt-1 text-sm text-white/60">
            {pad2(now.getDate())}.{pad2(now.getMonth() + 1)}.{now.getFullYear()}
          </div>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/20 backdrop-blur">
          <Lock size={22} />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-white">Ilova qulflangan</h1>
          <p className="mt-1 text-sm text-white/60">Davom etish uchun PIN kodni kiriting</p>
        </div>

        <div className={clsx('flex gap-3', error && 'animate-shake')}>
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={clsx(
                'h-3.5 w-3.5 rounded-full border-2 transition',
                error ? 'border-red-400 bg-red-400' : pin.length > i ? 'border-accent bg-accent' : 'border-white/25',
              )}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              disabled={verifying}
              onClick={() => setPin((p) => (p.length < 4 ? p + n : p))}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-lg font-medium text-white ring-1 ring-inset ring-white/10 transition hover:bg-white/15 active:scale-90"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            disabled={verifying}
            onClick={() => setPin((p) => (p.length < 4 ? p + '0' : p))}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-lg font-medium text-white ring-1 ring-inset ring-white/10 transition hover:bg-white/15 active:scale-90"
          >
            0
          </button>
          <button
            disabled={verifying}
            onClick={() => setPin((p) => p.slice(0, -1))}
            className="flex h-14 w-14 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 active:scale-90"
          >
            <Delete size={18} />
          </button>
        </div>

        <button onClick={() => setForgotOpen(true)} className="mt-1 text-xs text-white/45 transition hover:text-white/80 hover:underline">
          PIN esimdan chiqdimi?
        </button>
      </div>

      {forgotOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#1c1c1e] p-6 text-center shadow-2xl ring-1 ring-white/10">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <ShieldAlert size={22} />
            </div>
            <p className="mb-5 text-sm text-white/80">
              PIN qulfini butunlay o'chirib tashlaysizmi? Keyin Profil → Xavfsizlik bo'limidan yangi PIN o'rnatishingiz mumkin.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setForgotOpen(false)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Bekor qilish
              </button>
              <button
                disabled={resetting}
                onClick={handleResetPin}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
