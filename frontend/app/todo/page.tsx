'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { CalendarClock, Check, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Todo } from '@/lib/types';
import { formatDateUz, todayStr } from '@/lib/util';
import { Button, EmptyState, GlassCard, Input, Modal, Select } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useT } from '@/lib/settings-context';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 - 23:00

function shiftDate(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function TodoPage() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const [date, setDate] = useState(todayStr());
  const [now, setNow] = useState(new Date());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const queryKey = ['todos-by-date', date];
  const { data = [] } = useQuery({ queryKey, queryFn: () => api.get<Todo[]>(`/api/todos?date=${date}`) });

  const [form, setForm] = useState({ title: '', time: '', period: 'daily' });

  const create = useMutation({
    mutationFn: () => api.post('/api/todos', { title: form.title, due_date: date, time: form.time || undefined, period: form.period }),
    onSuccess: () => {
      toast(t('common', 'added'));
      setForm({ title: '', time: '', period: 'daily' });
      setOpen(false);
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['todos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const toggle = useMutation({
    mutationFn: (vars: { id: number; done: boolean }) => api.put(`/api/todos/${vars.id}`, { done: vars.done }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<Todo[]>(queryKey);
      qc.setQueryData<Todo[]>(queryKey, (old) => old?.map((item) => (item.id === vars.id ? { ...item, done: vars.done } : item)));
      return { previous };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/api/todos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const isToday = date === todayStr();
  const currentHour = now.getHours();
  const unscheduled = data.filter((item) => !item.time);
  const byHour = (hour: number) => data.filter((item) => item.time && Number(item.time.slice(0, 2)) === hour);
  const doneCount = data.filter((i) => i.done).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <CalendarClock size={24} className="text-accent" /> {t('todoPage', 'title')}
      </h1>

      <GlassCard className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:-translate-y-0.5 hover:bg-black/5 active:scale-90 dark:hover:bg-white/10"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-[150px] text-center">
            <div className="text-sm font-semibold">{isToday ? t('todoPage', 'today') : formatDateUz(date)}</div>
            {isToday && <div className="text-xs text-secondary">{formatDateUz(date)}</div>}
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:-translate-y-0.5 hover:bg-black/5 active:scale-90 dark:hover:bg-white/10"
          >
            <ChevronRight size={16} />
          </button>
          {!isToday && (
            <Button variant="secondary" className="ml-1 px-3 py-1.5 text-xs" onClick={() => setDate(todayStr())}>
              {t('todoPage', 'today')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-secondary">
            {doneCount} / {data.length} {t('todoPage', 'doneToday').toLowerCase()}
          </span>
          <Button onClick={() => setOpen(true)}>
            <Plus size={14} className="mr-1 inline" /> {t('todoPage', 'newTask')}
          </Button>
        </div>
      </GlassCard>

      {data.length === 0 ? (
        <EmptyState>{t('todoPage', 'noTasksDay')}</EmptyState>
      ) : (
        <GlassCard>
          {unscheduled.length > 0 && (
            <div className="mb-3 border-b border-black/5 pb-3 dark:border-white/5">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-secondary">{t('todoPage', 'unscheduled')}</div>
              <div className="flex flex-col gap-1">
                {unscheduled.map((item) => (
                  <TaskRow key={item.id} item={item} onToggle={(done) => toggle.mutate({ id: item.id, done })} onRemove={() => remove.mutate(item.id)} />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col">
            {HOURS.map((hour) => {
              const items = byHour(hour);
              const active = isToday && hour === currentHour;
              return (
                <div
                  key={hour}
                  className={clsx(
                    'flex gap-3 border-b border-black/5 py-2 last:border-none dark:border-white/5',
                    active && 'rounded-xl bg-accent/[0.06] px-2',
                  )}
                >
                  <div className="w-14 shrink-0 pt-1 text-right text-xs font-medium text-secondary">
                    {String(hour).padStart(2, '0')}:00
                    {active && <div className="mt-0.5 text-[10px] font-semibold text-accent">{t('todoPage', 'now')}</div>}
                  </div>
                  <div className="flex-1 pt-0.5">
                    {items.length === 0 ? (
                      <div className="h-6" />
                    ) : (
                      <div className="flex flex-col gap-1">
                        {items.map((item) => (
                          <TaskRow key={item.id} item={item} onToggle={(done) => toggle.mutate({ id: item.id, done })} onRemove={() => remove.mutate(item.id)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('todoPage', 'newTask')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <Input
            placeholder={t('todoPage', 'taskTitlePlaceholder')}
            required
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="flex-1" />
            <Select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
              <option value="daily">{t('education', 'daily')}</option>
              <option value="weekly">{t('education', 'weekly')}</option>
              <option value="monthly">{t('education', 'monthly')}</option>
            </Select>
          </div>
          <Button type="submit">{t('common', 'add')}</Button>
        </form>
      </Modal>
    </div>
  );
}

function TaskRow({ item, onToggle, onRemove }: { item: Todo; onToggle: (done: boolean) => void; onRemove: () => void }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl bg-black/[0.03] px-3 py-2 transition hover:bg-black/[0.05] dark:bg-white/5 dark:hover:bg-white/10">
      <button
        onClick={() => onToggle(!item.done)}
        className={clsx(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition active:scale-90',
          item.done ? 'border-green-500 bg-green-500 text-white' : 'border-black/15 text-transparent hover:border-accent dark:border-white/20',
        )}
      >
        <Check size={13} />
      </button>
      {item.time && <span className="shrink-0 text-xs font-medium text-secondary">{item.time}</span>}
      <span className={clsx('flex-1 text-sm', item.done && 'text-secondary line-through')}>{item.title}</span>
      <button onClick={onRemove} className="text-red-500/60 opacity-0 transition hover:text-red-600 group-hover:opacity-100">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
