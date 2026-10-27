'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookMarked, ExternalLink, Flame, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateUz, todayStr } from '@/lib/util';
import { Button, EmptyState, Input, Modal, Pill } from '@/components/ui';
import { LineChart } from '@/components/charts/LineChart';
import { useToast } from '@/components/Toast';
import { useT } from '@/lib/settings-context';

interface HadithSession {
  id: number;
  date: string;
  minutes: number | null;
  note: string | null;
}

interface HadithDetail {
  id: number;
  number: number;
  bookName: string;
  link: string;
  status: 'new' | 'reading' | 'memorized';
  sessions: HadithSession[];
  lastStudiedAt: string | null;
  streak: number;
  totalMinutes: number;
}

export function HadithDetailModal({ hadithId, onClose }: { hadithId: number | null; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['hadith-detail', hadithId],
    queryFn: () => api.get<HadithDetail>(`/api/hadith/${hadithId}`),
    enabled: hadithId !== null,
  });

  const [form, setForm] = useState({ date: todayStr(), minutes: '', note: '' });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['hadith-detail', hadithId] });
    qc.invalidateQueries({ queryKey: ['hadith-list'] });
    qc.invalidateQueries({ queryKey: ['hadith-stats'] });
  };

  const setStatus = useMutation({
    mutationFn: (status: 'new' | 'reading' | 'memorized') => api.put(`/api/hadith/${hadithId}/status`, { status }),
    onSuccess: invalidate,
  });

  const addSession = useMutation({
    mutationFn: () =>
      api.post(`/api/hadith/${hadithId}/sessions`, {
        date: form.date,
        minutes: form.minutes ? Number(form.minutes) : undefined,
        note: form.note || undefined,
      }),
    onSuccess: () => {
      toast(t('common', 'added'));
      setForm({ date: todayStr(), minutes: '', note: '' });
      invalidate();
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const removeSession = useMutation({
    mutationFn: (id: number) => api.del(`/api/hadith/sessions/${id}`),
    onSuccess: invalidate,
  });

  const sessions = data?.sessions || [];
  const chartCategories = sessions.map((s) => formatDateUz(s.date).slice(0, 5));
  const chartValues = sessions.map((s) => s.minutes || 1);

  return (
    <Modal open={hadithId !== null} onClose={onClose} title={data ? `${data.bookName} — ${data.number}` : ''} width="lg">
      {!data ? (
        <EmptyState>{t('common', 'loading')}</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <BookMarked size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">
                  {data.bookName}, {data.number}-{t('religious', 'hadis').toLowerCase()}
                </span>
                {data.status === 'memorized' && <Pill tone="green">{t('religious', 'achieved')}</Pill>}
                {data.status === 'reading' && <Pill tone="yellow">{t('religious', 'reading')}</Pill>}
                <Pill tone={data.streak > 0 ? 'green' : 'gray'}>
                  <Flame size={11} className="mr-0.5 -mt-0.5 inline" />
                  {data.streak} {t('education', 'streakDays')}
                </Pill>
              </div>
              <a href={data.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                <ExternalLink size={12} /> {t('religious', 'readOnSunnah')}
              </a>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
                <span>
                  {t('education', 'lastStudied')}: <strong className="text-[var(--text-primary)]">{data.lastStudiedAt ? formatDateUz(data.lastStudiedAt) : '—'}</strong>
                </span>
                <span>
                  {t('education', 'totalMinutes')}: <strong className="text-[var(--text-primary)]">{data.totalMinutes}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant={data.status === 'reading' ? 'primary' : 'secondary'} className="px-3 py-1.5 text-xs" onClick={() => setStatus.mutate('reading')}>
              {t('religious', 'startReading')}
            </Button>
            <Button variant={data.status === 'memorized' ? 'primary' : 'secondary'} className="px-3 py-1.5 text-xs" onClick={() => setStatus.mutate('memorized')}>
              {t('religious', 'markAchieved')}
            </Button>
          </div>

          {sessions.length > 1 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">{t('education', 'sessions')}</h4>
              <LineChart
                categories={chartCategories}
                series={[{ key: 'minutes', label: t('education', 'minutes'), color: 'var(--series-4)', values: chartValues }]}
                height={140}
              />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addSession.mutate();
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input
              type="number"
              min={1}
              placeholder={t('education', 'minutes')}
              value={form.minutes}
              onChange={(e) => setForm({ ...form, minutes: e.target.value })}
              className="w-28"
            />
            <Input placeholder={t('education', 'note')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="flex-1" />
            <Button type="submit">{t('education', 'addSession')}</Button>
          </form>

          <div>
            {sessions.length === 0 ? (
              <EmptyState>{t('education', 'noSessions')}</EmptyState>
            ) : (
              <div className="flex flex-col">
                {[...sessions].reverse().map((s) => (
                  <div key={s.id} className="flex items-center justify-between border-b border-black/5 py-2 text-sm last:border-none dark:border-white/5">
                    <span>
                      {formatDateUz(s.date)} {s.minutes ? `· ${s.minutes} ${t('education', 'minutes').toLowerCase()}` : ''} {s.note ? `· ${s.note}` : ''}
                    </span>
                    <button onClick={() => removeSession.mutate(s.id)} className="text-red-500/70 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
