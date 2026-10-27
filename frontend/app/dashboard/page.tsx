'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Activity, BookOpenText, Flame, LayoutDashboard, Moon as MoonIcon, Star, Wallet, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Dashboard } from '@/lib/types';
import { formatDateUz, formatMoney, PRAYER_LABELS, todayStr } from '@/lib/util';
import { CtaCard, Button, Textarea, Pill, EmptyState, Modal, GlassCard } from '@/components/ui';
import { BarChart } from '@/components/charts/BarChart';
import { RadarChart } from '@/components/charts/RadarChart';
import { useToast } from '@/components/Toast';
import { useT } from '@/lib/settings-context';

function pillTone(status: string | null) {
  if (status === 'green') return 'green';
  if (status === 'yellow') return 'yellow';
  if (status === 'red') return 'red';
  return 'gray';
}

function pillLabel(status: string | null, t: ReturnType<typeof useT>) {
  if (status === 'green') return `🟢 ${t('religious', 'onTime')}`;
  if (status === 'yellow') return `🟡 ${t('religious', 'qaza')}`;
  if (status === 'red') return `🔴 ${t('religious', 'qaza')}`;
  return `— ${t('religious', 'notStarted')}`;
}

interface WeekDay {
  date: string;
  tasksDone: number;
  tasksTotal: number;
  prayersDone: number;
  prayersTotal: number;
}

interface SkillSummary {
  id: number;
  name: string;
  streak: number;
  totalMinutes: number;
  planMinutes: number | null;
}

type Section = 'finance' | 'todos' | 'prayers' | 'quran' | 'mood' | 'activity' | 'skills' | null;

export default function DashboardPage() {
  const date = todayStr();
  const t = useT();
  const qc = useQueryClient();
  const queryKey = ['dashboard', date];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<Dashboard>(`/api/dashboard?date=${date}`),
  });
  const { data: week } = useQuery({
    queryKey: ['dashboard-week', date],
    queryFn: () => api.get<WeekDay[]>(`/api/dashboard/week?date=${date}`),
  });
  const { data: skills } = useQuery({ queryKey: ['skills'], queryFn: () => api.get<SkillSummary[]>('/api/skills') });

  const [section, setSection] = useState<Section>(null);

  const toggleTodoMutation = useMutation({
    mutationFn: (vars: { id: number; done: boolean }) => api.put(`/api/todos/${vars.id}`, { done: vars.done }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<Dashboard>(queryKey);
      qc.setQueryData<Dashboard>(queryKey, (old) => {
        if (!old) return old;
        const items = old.todos.items.map((item) => (item.id === vars.id ? { ...item, done: vars.done } : item));
        return { ...old, todos: { ...old.todos, items, done: items.filter((item) => item.done).length } };
      });
      return { previous };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  if (isLoading || !data) return <EmptyState>{t('common', 'loading')}</EmptyState>;

  const topStreak = (skills || []).reduce((max, s) => Math.max(max, s.streak), 0);
  const skillRadarAxes = [...(skills || [])]
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 8)
    .map((s) => ({
      label: s.name.length > 10 ? `${s.name.slice(0, 9)}…` : s.name,
      value: s.planMinutes ? Math.min(100, (s.totalMinutes / s.planMinutes) * 100) : Math.min(100, (s.totalMinutes / 300) * 100),
    }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <LayoutDashboard size={22} className="text-accent" /> {t('dashboard', 'title')} — {formatDateUz(date)}
      </h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <CtaCard icon={<Wallet size={20} />} title={t('dashboard', 'balance')} sub={formatMoney(data.balance)} tone="blue" onClick={() => setSection('finance')} />
        <CtaCard
          icon={<CheckCircle2 size={20} />}
          title={t('dashboard', 'tasksToday')}
          sub={`${data.todos.done} / ${data.todos.total}`}
          tone="green"
          onClick={() => setSection('todos')}
        />
        <CtaCard
          icon={<MoonIcon size={20} />}
          title={t('dashboard', 'prayersToday')}
          sub={`${data.prayers.done} / ${data.prayers.total}`}
          tone="violet"
          onClick={() => setSection('prayers')}
        />
        <CtaCard icon={<BookOpenText size={20} />} title={t('dashboard', 'quranMemo')} sub={String(data.quran.length)} tone="teal" onClick={() => setSection('quran')} />
        <CtaCard
          icon={<Star size={20} />}
          title={t('dashboard', 'ratePrompt')}
          sub={data.day.rating ? `${data.day.rating} / 10` : '—'}
          tone="yellow"
          onClick={() => setSection('mood')}
        />
        <CtaCard icon={<Activity size={20} />} title={t('dashboard', 'weeklyActivity')} sub={t('common', 'date')} tone="orange" onClick={() => setSection('activity')} />
        {skills && skills.length > 0 && (
          <CtaCard icon={<Flame size={20} />} title={t('education', 'skills')} sub={`${topStreak} ${t('education', 'streakDays')}`} tone="pink" onClick={() => setSection('skills')} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {week && (
          <GlassCard>
            <h2 className="mb-3 text-sm font-semibold">{t('dashboard', 'weeklyActivity')}</h2>
            <BarChart
              categories={week.map((d) => formatDateUz(d.date).slice(0, 5))}
              series={[
                { key: 'tasks', label: t('dashboard', 'tasksToday'), color: 'var(--series-1)', values: week.map((d) => d.tasksDone) },
                { key: 'prayers', label: t('dashboard', 'prayersToday'), color: 'var(--series-3)', values: week.map((d) => d.prayersDone) },
              ]}
            />
          </GlassCard>
        )}
        {skillRadarAxes.length >= 3 && (
          <GlassCard className="flex flex-col items-center">
            <h2 className="mb-1 w-full text-sm font-semibold">{t('education', 'skills')}</h2>
            <RadarChart axes={skillRadarAxes} color="var(--series-1)" size={240} />
            <span className="text-xs text-secondary">{t('education', 'radarHint')}</span>
          </GlassCard>
        )}
      </div>

      <FinanceModal open={section === 'finance'} onClose={() => setSection(null)} data={data} />
      <TodosModal open={section === 'todos'} onClose={() => setSection(null)} data={data} onToggle={(id, done) => toggleTodoMutation.mutate({ id, done })} />
      <PrayersModal open={section === 'prayers'} onClose={() => setSection(null)} data={data} />
      <QuranModal open={section === 'quran'} onClose={() => setSection(null)} data={data} />
      <MoodModal open={section === 'mood'} onClose={() => setSection(null)} date={date} data={data} queryKey={queryKey} />
      <ActivityModal open={section === 'activity'} onClose={() => setSection(null)} week={week} />
      <SkillsModal open={section === 'skills'} onClose={() => setSection(null)} skills={skills} />
    </div>
  );
}

function FinanceModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: Dashboard }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} title={t('dashboard', 'balance')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-white/5">
          <div className="text-xs text-secondary">{t('dashboard', 'balance')}</div>
          <div className="text-xl font-semibold">{formatMoney(data.balance)}</div>
        </div>
        <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-white/5">
          <div className="text-xs text-secondary">{t('dashboard', 'income')}</div>
          <div className="text-xl font-semibold text-green-600">{formatMoney(data.income)}</div>
        </div>
        <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-white/5">
          <div className="text-xs text-secondary">{t('dashboard', 'expense')}</div>
          <div className="text-xl font-semibold text-red-500">{formatMoney(data.expense)}</div>
        </div>
      </div>
      <a href="/finance" className="mt-4 inline-block">
        <Button variant="secondary">{t('nav', 'finance')} →</Button>
      </a>
    </Modal>
  );
}

function TodosModal({
  open,
  onClose,
  data,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  data: Dashboard;
  onToggle: (id: number, done: boolean) => void;
}) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} title={t('dashboard', 'todoList')}>
      {data.todos.items.length === 0 ? (
        <EmptyState>{t('dashboard', 'noTasksToday')}</EmptyState>
      ) : (
        <div className="flex flex-col">
          {data.todos.items.map((item) => (
            <label key={item.id} className="flex items-center gap-3 border-b border-black/5 py-2 last:border-none dark:border-white/5">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => onToggle(item.id, e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              <span className={item.done ? 'text-secondary line-through' : ''}>{item.title}</span>
            </label>
          ))}
        </div>
      )}
      <a href="/education" className="mt-4 inline-block">
        <Button variant="secondary">{t('nav', 'education')} →</Button>
      </a>
    </Modal>
  );
}

function PrayersModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: Dashboard }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} title={t('dashboard', 'prayersToday')}>
      <div className="flex flex-col gap-2">
        {data.prayers.items.map((p) => (
          <div key={p.name} className="flex items-center justify-between border-b border-black/5 py-2 last:border-none dark:border-white/5">
            <span className="text-sm">{PRAYER_LABELS[p.name]}</span>
            <Pill tone={pillTone(p.status) as any}>{pillLabel(p.status, t)}</Pill>
          </div>
        ))}
      </div>
      <a href="/religious" className="mt-4 inline-block">
        <Button variant="secondary">{t('nav', 'religious')} →</Button>
      </a>
    </Modal>
  );
}

function QuranModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: Dashboard }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} title={t('dashboard', 'quranMemo')}>
      <div className="rounded-2xl bg-black/[0.03] p-4 text-center dark:bg-white/5">
        <div className="text-3xl font-semibold">{data.quran.length}</div>
        <div className="text-xs text-secondary">{t('dashboard', 'entriesToday')}</div>
      </div>
      <a href="/religious" className="mt-4 inline-block">
        <Button variant="secondary">{t('nav', 'religious')} →</Button>
      </a>
    </Modal>
  );
}

function MoodModal({
  open,
  onClose,
  date,
  data,
  queryKey,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  data: Dashboard;
  queryKey: readonly unknown[];
}) {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const [note, setNote] = useState(data.day.note || '');

  useEffect(() => {
    setNote(data.day.note || '');
  }, [data.day.note]);

  const saveDayMutation = useMutation({
    mutationFn: (rating: number | null) => api.put(`/api/days/${date}`, { rating, note }),
    onSuccess: () => {
      toast(t('common', 'saved'));
      qc.invalidateQueries({ queryKey });
    },
    onError: (e) => toast((e as Error).message, true),
  });

  return (
    <Modal open={open} onClose={onClose} title={t('dashboard', 'ratePrompt')}>
      <div className="mb-3 flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={() => saveDayMutation.mutate(n)} aria-label={`${n} ball`} className="transition hover:scale-110 active:scale-95">
            <Star size={22} className={n <= (data.day.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-black/15 dark:text-white/15'} />
          </button>
        ))}
      </div>
      <Textarea rows={3} placeholder={t('dashboard', 'notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="mt-3">
        <Button onClick={() => saveDayMutation.mutate(data.day.rating)}>{t('common', 'save')}</Button>
      </div>
    </Modal>
  );
}

function ActivityModal({ open, onClose, week }: { open: boolean; onClose: () => void; week?: WeekDay[] }) {
  const t = useT();
  if (!week) return null;
  const weekCategories = week.map((d) => formatDateUz(d.date).slice(0, 5));
  return (
    <Modal open={open} onClose={onClose} title={t('dashboard', 'weeklyActivity')} width="lg">
      <BarChart
        categories={weekCategories}
        series={[
          { key: 'tasks', label: t('dashboard', 'tasksToday'), color: 'var(--series-1)', values: week.map((d) => d.tasksDone) },
          { key: 'prayers', label: t('dashboard', 'prayersToday'), color: 'var(--series-3)', values: week.map((d) => d.prayersDone) },
        ]}
      />
    </Modal>
  );
}

function SkillsModal({ open, onClose, skills }: { open: boolean; onClose: () => void; skills?: SkillSummary[] }) {
  const t = useT();
  const top = [...(skills || [])].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 8);
  const radarAxes = top.map((s) => ({
    label: s.name.length > 10 ? `${s.name.slice(0, 9)}…` : s.name,
    value: s.planMinutes ? Math.min(100, (s.totalMinutes / s.planMinutes) * 100) : Math.min(100, (s.totalMinutes / 300) * 100),
  }));

  return (
    <Modal open={open} onClose={onClose} title={t('education', 'skills')} width="lg">
      {!skills || skills.length === 0 ? (
        <EmptyState>{t('education', 'noSkills')}</EmptyState>
      ) : (
        <>
          {radarAxes.length >= 3 && (
            <div className="mb-4 flex flex-col items-center">
              <RadarChart axes={radarAxes} color="var(--series-1)" size={280} />
              <span className="text-xs text-secondary">{t('education', 'radarHint')}</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {[...skills]
              .sort((a, b) => b.streak - a.streak)
              .map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/5">
                  <span className="text-sm font-medium">{s.name}</span>
                  <Pill tone={s.streak > 0 ? 'green' : 'gray'}>
                    <Flame size={11} className="mr-0.5 -mt-0.5 inline" />
                    {s.streak} {t('education', 'streakDays')}
                  </Pill>
                </div>
              ))}
          </div>
        </>
      )}
      <a href="/education" className="mt-4 inline-block">
        <Button variant="secondary">{t('nav', 'education')} →</Button>
      </a>
    </Modal>
  );
}
