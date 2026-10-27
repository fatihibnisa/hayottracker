'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Bell, CheckCircle2, Clock3, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import { Todo } from '@/lib/types';
import { PRAYER_LABELS, todayStr } from '@/lib/util';
import { nextPrayer, PrayerTimes } from '@/lib/prayer-utils';
import { useSettings, useT } from '@/lib/settings-context';

interface SkillSummary {
  id: number;
  name: string;
  streak: number;
  lastStudiedAt: string | null;
}

interface NotificationItem {
  id: string;
  icon: React.ReactNode;
  text: string;
  tone: 'accent' | 'orange' | 'red';
}

export function NotificationBell() {
  const t = useT();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const ref = useRef<HTMLDivElement>(null);
  const date = todayStr();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const timings = useQuery({
    queryKey: ['prayer-times', date, settings.city, settings.country],
    queryFn: () => api.get<PrayerTimes & { date: string }>(`/api/religious/prayer-times?date=${date}&city=${encodeURIComponent(settings.city)}&country=${encodeURIComponent(settings.country)}`),
    staleTime: 60 * 60 * 1000,
  });
  const todos = useQuery({ queryKey: ['todos-by-date', date], queryFn: () => api.get<Todo[]>(`/api/todos?date=${date}`) });
  const skills = useQuery({ queryKey: ['skills'], queryFn: () => api.get<SkillSummary[]>('/api/skills') });

  const items: NotificationItem[] = [];

  if (timings.data) {
    const next = nextPrayer(timings.data, now);
    if (next.inMinutes <= 30) {
      items.push({
        id: 'next-prayer',
        icon: <Clock3 size={14} />,
        text: `${PRAYER_LABELS[next.key]} ${next.inMinutes <= 1 ? 'hozir boshlanadi' : `${next.inMinutes} daqiqadan keyin boshlanadi`}`,
        tone: 'accent',
      });
    }
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  (todos.data || [])
    .filter((item) => !item.done && item.time)
    .forEach((item) => {
      const [h, m] = (item.time as string).split(':').map(Number);
      const taskMinutes = h * 60 + m;
      if (taskMinutes < nowMinutes) {
        items.push({ id: `todo-${item.id}`, icon: <Clock3 size={14} />, text: `"${item.title}" vaqti o'tib ketdi (${item.time})`, tone: 'red' });
      }
    });

  if (now.getHours() >= 18) {
    (skills.data || [])
      .filter((s) => s.streak > 0 && s.lastStudiedAt !== date)
      .forEach((s) => {
        items.push({ id: `streak-${s.id}`, icon: <Flame size={14} />, text: `"${s.name}" streak'ini uzmaslik uchun bugun mashq qiling (${s.streak} kun)`, tone: 'orange' });
      });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass relative flex h-10 w-10 items-center justify-center rounded-full transition hover:-translate-y-0.5 hover:shadow-lg active:scale-90"
        aria-label="notifications"
      >
        <Bell size={17} />
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-pop-in absolute right-0 top-[calc(100%+8px)] z-40 w-80 overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1c1e]/95">
          <div className="border-b border-black/5 px-4 py-3 text-sm font-semibold dark:border-white/10">{t('common', 'notifications')}</div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-xs text-secondary">
                <CheckCircle2 size={22} className="text-green-500" />
                {t('common', 'noNotifications')}
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 border-b border-black/5 px-4 py-3 text-xs last:border-none dark:border-white/5">
                  <span
                    className={clsx(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                      item.tone === 'accent' && 'bg-accent/15 text-accent',
                      item.tone === 'orange' && 'cta-tone-orange',
                      item.tone === 'red' && 'cta-tone-red',
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[var(--text-primary)]">{item.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
