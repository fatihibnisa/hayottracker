'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Target, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateUz, todayStr } from '@/lib/util';
import { Button, EmptyState, Input, Modal, Pill } from '@/components/ui';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { LineChart } from '@/components/charts/LineChart';
import { skillIcon } from '@/lib/skill-icons';
import { useToast } from '@/components/Toast';
import { useT } from '@/lib/settings-context';

interface SkillSession {
  id: number;
  date: string;
  minutes: number | null;
  note: string | null;
}

interface SkillDetail {
  id: number;
  name: string;
  category: string | null;
  icon: string | null;
  description: string | null;
  targetDate: string | null;
  planMinutes: number | null;
  createdAt: string;
  sessions: SkillSession[];
  lastStudiedAt: string | null;
  streak: number;
  totalMinutes: number;
}

export function SkillDetailModal({ skillId, onClose }: { skillId: number | null; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['skill-detail', skillId],
    queryFn: () => api.get<SkillDetail>(`/api/skills/${skillId}`),
    enabled: skillId !== null,
  });

  const [form, setForm] = useState({ date: todayStr(), minutes: '', note: '' });

  const addSession = useMutation({
    mutationFn: () =>
      api.post(`/api/skills/${skillId}/sessions`, {
        date: form.date,
        minutes: form.minutes ? Number(form.minutes) : undefined,
        note: form.note || undefined,
      }),
    onSuccess: () => {
      toast(t('common', 'added'));
      setForm({ date: todayStr(), minutes: '', note: '' });
      qc.invalidateQueries({ queryKey: ['skill-detail', skillId] });
      qc.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const removeSession = useMutation({
    mutationFn: (id: number) => api.del(`/api/skills/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skill-detail', skillId] });
      qc.invalidateQueries({ queryKey: ['skills'] });
    },
  });

  const sessions = data?.sessions || [];
  const chartCategories = sessions.map((s) => formatDateUz(s.date).slice(0, 5));
  const chartValues = sessions.map((s) => s.minutes || 1);

  return (
    <Modal open={skillId !== null} onClose={onClose} title={data?.name || ''} width="lg">
      {!data ? (
        <EmptyState>{t('common', 'loading')}</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            {data.planMinutes ? (
              <ProgressRing value={data.totalMinutes} total={data.planMinutes} size={56} stroke={6} color="var(--series-6)" />
            ) : (
              (() => {
                const SkillIcon = skillIcon(data.icon);
                return (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <SkillIcon size={22} />
                  </div>
                );
              })()
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm text-secondary">
                {data.category && <Pill tone="gray">{data.category}</Pill>}
                <Pill tone={data.streak > 0 ? 'green' : 'gray'}>
                  <Flame size={11} className="mr-0.5 -mt-0.5 inline" />
                  {data.streak} {t('education', 'streakDays')}
                </Pill>
                {data.targetDate && (
                  <Pill tone="gray">
                    <Target size={11} className="mr-0.5 -mt-0.5 inline" />
                    {formatDateUz(data.targetDate)}
                  </Pill>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
                <span>
                  {t('education', 'lastStudied')}: <strong className="text-[var(--text-primary)]">{data.lastStudiedAt ? formatDateUz(data.lastStudiedAt) : '—'}</strong>
                </span>
                <span>
                  {t('education', 'totalMinutes')}: <strong className="text-[var(--text-primary)]">{data.totalMinutes}</strong>
                  {data.planMinutes ? ` / ${data.planMinutes}` : ''}
                </span>
              </div>
              {data.description && <p className="mt-2 text-sm text-secondary">{data.description}</p>}
            </div>
          </div>

          {sessions.length > 1 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">{t('education', 'sessions')}</h4>
              <LineChart
                categories={chartCategories}
                series={[{ key: 'minutes', label: t('education', 'minutes'), color: 'var(--series-6)', values: chartValues }]}
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
