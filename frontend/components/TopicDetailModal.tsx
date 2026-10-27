'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateUz, MODULE_LABELS, todayStr } from '@/lib/util';
import { Button, EmptyState, Input, Modal, Pill } from '@/components/ui';
import { LineChart } from '@/components/charts/LineChart';
import { useToast } from '@/components/Toast';
import { useT } from '@/lib/settings-context';

interface TopicSession {
  id: number;
  date: string;
  minutes: number | null;
  note: string | null;
}

interface TopicDetail {
  id: number;
  module: 'data_science' | 'english';
  title: string;
  status: 'todo' | 'done';
  createdAt: string;
  completedAt: string | null;
  sessions: TopicSession[];
  lastStudiedAt: string | null;
}

export function TopicDetailModal({ topicId, onClose }: { topicId: number | null; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['topic-detail', topicId],
    queryFn: () => api.get<TopicDetail>(`/api/topics/${topicId}`),
    enabled: topicId !== null,
  });

  const [form, setForm] = useState({ date: todayStr(), minutes: '', note: '' });

  const addSession = useMutation({
    mutationFn: () =>
      api.post(`/api/topics/${topicId}/sessions`, {
        date: form.date,
        minutes: form.minutes ? Number(form.minutes) : undefined,
        note: form.note || undefined,
      }),
    onSuccess: () => {
      toast(t('common', 'added'));
      setForm({ date: todayStr(), minutes: '', note: '' });
      qc.invalidateQueries({ queryKey: ['topic-detail', topicId] });
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const removeSession = useMutation({
    mutationFn: (id: number) => api.del(`/api/topics/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topic-detail', topicId] }),
  });

  const sessions = data?.sessions || [];
  const chartCategories = sessions.map((s) => formatDateUz(s.date).slice(0, 5));
  const chartValues = sessions.map((s) => s.minutes || 1);

  return (
    <Modal open={topicId !== null} onClose={onClose} title={data?.title || ''} width="lg">
      {!data ? (
        <EmptyState>{t('common', 'loading')}</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-secondary">
            <Pill tone={data.status === 'done' ? 'green' : 'gray'}>{MODULE_LABELS[data.module]}</Pill>
            <span>
              {t('education', 'since')}: <strong className="text-[var(--text-primary)]">{formatDateUz(data.createdAt)}</strong>
            </span>
            <span>
              {t('education', 'lastStudied')}:{' '}
              <strong className="text-[var(--text-primary)]">{data.lastStudiedAt ? formatDateUz(data.lastStudiedAt) : '—'}</strong>
            </span>
          </div>

          {sessions.length > 1 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">{t('education', 'sessions')}</h4>
              <LineChart
                categories={chartCategories}
                series={[{ key: 'minutes', label: t('education', 'minutes'), color: 'var(--series-1)', values: chartValues }]}
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
