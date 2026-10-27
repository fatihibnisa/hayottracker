'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Flame, GraduationCap, Sparkles, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ScheduleItem, Todo, Topic } from '@/lib/types';
import { DAY_NAMES_UZ, formatDateUz, MODULE_LABELS, todayStr } from '@/lib/util';
import { Button, CtaCard, EmptyState, GlassCard, Input, Modal, Pill, Select, Textarea } from '@/components/ui';
import { BarChart } from '@/components/charts/BarChart';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { ScheduleOcrUpload } from '@/components/ScheduleOcrUpload';
import { SkillDetailModal } from '@/components/SkillDetailModal';
import { IconPicker } from '@/components/IconPicker';
import { skillIcon } from '@/lib/skill-icons';
import { useToast } from '@/components/Toast';
import { useT } from '@/lib/settings-context';

type SubTab = 'schedule' | 'skills' | 'todos' | 'history';

export default function EducationPage() {
  const t = useT();
  const [tab, setTab] = useState<SubTab>('schedule');
  const subtabs: { key: SubTab; label: string }[] = [
    { key: 'schedule', label: t('education', 'schedule') },
    { key: 'skills', label: t('education', 'skills') },
    { key: 'todos', label: t('education', 'plans') },
    { key: 'history', label: t('education', 'history') },
  ];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <GraduationCap size={22} className="text-accent" /> {t('education', 'title')}
      </h1>
      <div className="flex flex-wrap gap-2">
        {subtabs.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              tab === s.key ? 'bg-accent text-white' : 'glass text-[var(--text-primary)]',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {tab === 'schedule' && <ScheduleTab />}
      {tab === 'skills' && <SkillsTab />}
      {tab === 'todos' && <TodosTab />}
      {tab === 'history' && <HistoryTab />}
    </div>
  );
}

function ScheduleTab() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['schedule'], queryFn: () => api.get<ScheduleItem[]>('/api/schedule') });
  const [form, setForm] = useState({ day_of_week: '0', subject: '', start_time: '', end_time: '', room: '' });

  const create = useMutation({
    mutationFn: () =>
      api.post('/api/schedule', {
        day_of_week: Number(form.day_of_week),
        subject: form.subject,
        start_time: form.start_time,
        end_time: form.end_time || null,
        room: form.room || null,
      }),
    onSuccess: () => {
      toast(t('common', 'added'));
      setForm({ day_of_week: '0', subject: '', start_time: '', end_time: '', room: '' });
      qc.invalidateQueries({ queryKey: ['schedule'] });
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/api/schedule/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <ScheduleOcrUpload />

      <GlassCard>
        <h2 className="mb-3 text-base font-semibold">{t('education', 'addLesson')}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <Select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
            {DAY_NAMES_UZ.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </Select>
          <Input placeholder="Fan nomi" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          <Input placeholder="Xona" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          <Button type="submit">{t('common', 'add')}</Button>
        </form>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-3 text-base font-semibold">{t('education', 'weeklySchedule')}</h2>
        <div className="flex flex-col gap-4">
          {DAY_NAMES_UZ.map((day, idx) => {
            const items = data.filter((it) => it.dayOfWeek === idx);
            return (
              <div key={day}>
                <div className="mb-1 text-sm font-semibold">{day}</div>
                {items.length === 0 ? (
                  <EmptyState>{t('education', 'noLesson')}</EmptyState>
                ) : (
                  <div className="flex flex-col gap-1">
                    {items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-3 py-2 text-sm dark:bg-white/5">
                        <span>
                          {it.startTime}
                          {it.endTime ? ` - ${it.endTime}` : ''} · {it.subject} {it.room && `· xona: ${it.room}`}
                        </span>
                        <button onClick={() => remove.mutate(it.id)} className="text-red-500/70 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

interface SkillSummary {
  id: number;
  name: string;
  category: string | null;
  icon: string | null;
  description: string | null;
  targetDate: string | null;
  planMinutes: number | null;
  sessionsCount: number;
  totalMinutes: number;
  streak: number;
  lastStudiedAt: string | null;
}

const SKILL_TONES = ['blue', 'teal', 'violet', 'orange', 'pink', 'green', 'yellow', 'red'] as const;

function SkillsTab() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['skills'], queryFn: () => api.get<SkillSummary[]>('/api/skills') });
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'hard', icon: 'sparkles', targetDate: '', planMinutes: '', description: '' });
  const [openSkill, setOpenSkill] = useState<number | null>(null);

  const categoryLabel: Record<string, string> = {
    hard: t('education', 'hardSkill'),
    language: t('education', 'languageCourse'),
    other: t('education', 'other'),
  };

  const create = useMutation({
    mutationFn: () =>
      api.post('/api/skills', {
        name: form.name,
        category: categoryLabel[form.category],
        icon: form.icon,
        targetDate: form.targetDate || undefined,
        planMinutes: form.planMinutes ? Number(form.planMinutes) : undefined,
        description: form.description || undefined,
      }),
    onSuccess: () => {
      toast(t('common', 'added'));
      setForm({ name: '', category: 'hard', icon: 'sparkles', targetDate: '', planMinutes: '', description: '' });
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/api/skills/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <CtaCard
        icon={<Sparkles size={20} />}
        title={t('education', 'newSkill')}
        sub={t('education', 'skillNamePlaceholder')}
        tone="violet"
        onClick={() => setCreateOpen(true)}
      />

      {data.length === 0 ? (
        <EmptyState>{t('education', 'noSkills')}</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.map((skill, i) => {
            const SkillIcon = skillIcon(skill.icon);
            return (
              <div key={skill.id} className="group relative">
                <CtaCard
                  icon={<SkillIcon size={18} />}
                  title={skill.name}
                  sub={`${skill.category || ''} · ${skill.sessionsCount} ${t('education', 'sessions').toLowerCase()}`}
                  tone={SKILL_TONES[i % SKILL_TONES.length]}
                  onClick={() => setOpenSkill(skill.id)}
                  badge={
                    skill.streak > 0 ? (
                      <Pill tone="green">
                        <Flame size={11} className="mr-0.5 -mt-0.5 inline" />
                        {skill.streak}
                      </Pill>
                    ) : undefined
                  }
                />
                <button
                  onClick={() => remove.mutate(skill.id)}
                  className="absolute right-3 top-3 rounded-full p-1 text-red-500/50 opacity-0 transition hover:bg-red-500/10 hover:text-red-600 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('education', 'newSkill')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
            <Input
              className="flex-1"
              placeholder={t('education', 'skillNamePlaceholder')}
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="hard">{t('education', 'hardSkill')}</option>
            <option value="language">{t('education', 'languageCourse')}</option>
            <option value="other">{t('education', 'other')}</option>
          </Select>
          <div className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 text-xs text-secondary">
              {t('education', 'targetDateLabel')}
              <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="flex-1" />
            </label>
            <label className="flex items-center gap-2 text-xs text-secondary">
              {t('education', 'planMinutesLabel')}
              <Input
                type="number"
                min={1}
                placeholder="60"
                value={form.planMinutes}
                onChange={(e) => setForm({ ...form, planMinutes: e.target.value })}
                className="w-24"
              />
            </label>
          </div>
          <Textarea
            rows={2}
            placeholder={t('education', 'skillDescriptionPlaceholder')}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button type="submit">{t('common', 'add')}</Button>
        </form>
      </Modal>

      <SkillDetailModal skillId={openSkill} onClose={() => setOpenSkill(null)} />
    </div>
  );
}

function TodosTab() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const daily = useQuery({ queryKey: ['todos', 'daily'], queryFn: () => api.get<Todo[]>('/api/todos?period=daily') });
  const weekly = useQuery({ queryKey: ['todos', 'weekly'], queryFn: () => api.get<Todo[]>('/api/todos?period=weekly') });
  const monthly = useQuery({ queryKey: ['todos', 'monthly'], queryFn: () => api.get<Todo[]>('/api/todos?period=monthly') });

  const [form, setForm] = useState({ title: '', period: 'daily', due_date: todayStr() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['todos'] });

  const create = useMutation({
    mutationFn: () => api.post('/api/todos', form),
    onSuccess: () => {
      toast(t('common', 'added'));
      setForm({ title: '', period: 'daily', due_date: todayStr() });
      invalidate();
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const todoKeys = [
    ['todos', 'daily'],
    ['todos', 'weekly'],
    ['todos', 'monthly'],
  ] as const;

  const toggle = useMutation({
    mutationFn: (vars: { id: number; done: boolean }) => api.put(`/api/todos/${vars.id}`, { done: vars.done }),
    onMutate: async (vars) => {
      await Promise.all(todoKeys.map((k) => qc.cancelQueries({ queryKey: k })));
      const previous = todoKeys.map((k) => [k, qc.getQueryData<Todo[]>(k)] as const);
      for (const k of todoKeys) {
        qc.setQueryData<Todo[]>(k, (old) => old?.map((item) => (item.id === vars.id ? { ...item, done: vars.done } : item)));
      }
      return { previous };
    },
    onError: (e, _vars, ctx) => {
      ctx?.previous.forEach(([k, data]) => qc.setQueryData(k, data));
      toast((e as Error).message, true);
    },
    onSettled: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: number) => api.del(`/api/todos/${id}`), onSuccess: invalidate });

  function List(items: Todo[] = []) {
    if (items.length === 0) return <EmptyState>{t('education', 'noPlans')}</EmptyState>;
    return (
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-2 py-1.5 dark:bg-white/5">
            <button
              onClick={() => toggle.mutate({ id: item.id, done: !item.done })}
              className={clsx(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition',
                item.done ? 'border-green-500 bg-green-500 text-white' : 'border-black/15 text-transparent dark:border-white/20',
              )}
            >
              <Check size={13} />
            </button>
            <span className={clsx('flex-1 text-sm', item.done && 'text-secondary line-through')}>
              {item.title} {item.dueDate && <span className="text-secondary">({formatDateUz(item.dueDate)})</span>}
            </span>
            <button onClick={() => remove.mutate(item.id)} className="text-red-500/70 hover:text-red-600">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    );
  }

  const periodChart = [
    { label: t('education', 'daily'), items: daily.data || [] },
    { label: t('education', 'weekly'), items: weekly.data || [] },
    { label: t('education', 'monthly'), items: monthly.data || [] },
  ];

  return (
    <div className="flex flex-col gap-6">
      <GlassCard>
        <h2 className="mb-3 text-base font-semibold">{t('education', 'newPlanPlaceholder')}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <Input className="flex-1" placeholder={t('education', 'newPlanPlaceholder')} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
            <option value="daily">{t('education', 'daily')}</option>
            <option value="weekly">{t('education', 'weekly')}</option>
            <option value="monthly">{t('education', 'monthly')}</option>
          </Select>
          <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <Button type="submit">{t('common', 'add')}</Button>
        </form>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-3 text-base font-semibold">{t('education', 'tasksProgress')}</h2>
        <BarChart
          categories={periodChart.map((p) => p.label)}
          series={[
            { key: 'done', label: t('education', 'done'), color: 'var(--series-1)', values: periodChart.map((p) => p.items.filter((i) => i.done).length) },
            { key: 'pending', label: t('education', 'pending'), color: 'var(--series-4)', values: periodChart.map((p) => p.items.filter((i) => !i.done).length) },
          ]}
        />
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <GlassCard>
          <h2 className="mb-3 text-base font-semibold">{t('education', 'daily')}</h2>
          {List(daily.data)}
        </GlassCard>
        <GlassCard>
          <h2 className="mb-3 text-base font-semibold">{t('education', 'weekly')}</h2>
          {List(weekly.data)}
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="mb-3 text-base font-semibold">{t('education', 'monthlyPlans')}</h2>
        {List(monthly.data)}
      </GlassCard>
    </div>
  );
}

function HistoryTab() {
  const t = useT();
  const ds = useQuery({ queryKey: ['topics', 'data_science', 'done'], queryFn: () => api.get<Topic[]>('/api/topics?module=data_science&status=done') });
  const en = useQuery({ queryKey: ['topics', 'english', 'done'], queryFn: () => api.get<Topic[]>('/api/topics?module=english&status=done') });
  const dsTodo = useQuery({ queryKey: ['topics', 'data_science', 'todo'], queryFn: () => api.get<Topic[]>('/api/topics?module=data_science&status=todo') });
  const enTodo = useQuery({ queryKey: ['topics', 'english', 'todo'], queryFn: () => api.get<Topic[]>('/api/topics?module=english&status=todo') });
  const all = [...(ds.data || []), ...(en.data || [])].sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="flex items-center gap-4">
          <ProgressRing value={(ds.data || []).length} total={(ds.data || []).length + (dsTodo.data || []).length} color="var(--series-1)" />
          <div>
            <div className="text-sm font-semibold">{MODULE_LABELS.data_science}</div>
            <div className="text-xs text-secondary">
              {(ds.data || []).length} / {(ds.data || []).length + (dsTodo.data || []).length}
            </div>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4">
          <ProgressRing value={(en.data || []).length} total={(en.data || []).length + (enTodo.data || []).length} color="var(--series-3)" />
          <div>
            <div className="text-sm font-semibold">{MODULE_LABELS.english}</div>
            <div className="text-xs text-secondary">
              {(en.data || []).length} / {(en.data || []).length + (enTodo.data || []).length}
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="mb-3 text-base font-semibold">{t('education', 'topicHistory')}</h2>
        {all.length === 0 ? (
          <EmptyState>{t('education', 'noCompletedTopics')}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-secondary">
                <th className="py-2">{t('education', 'module')}</th>
                <th className="py-2">{t('education', 'topic')}</th>
                <th className="py-2">{t('education', 'completedDate')}</th>
              </tr>
            </thead>
            <tbody>
              {all.map((topic) => (
                <tr key={topic.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="py-2">{MODULE_LABELS[topic.module]}</td>
                  <td className="py-2">{topic.title}</td>
                  <td className="py-2">{topic.completedAt ? formatDateUz(topic.completedAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}
