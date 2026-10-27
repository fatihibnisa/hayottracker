'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BarChart3, Download, FolderCog, Lock, PieChart, Settings as SettingsIcon, Shield, Sparkles, Trophy, Upload, User } from 'lucide-react';
import { api } from '@/lib/api';
import { Dashboard } from '@/lib/types';
import { formatMoney, todayStr } from '@/lib/util';
import { LANGS } from '@/lib/i18n';
import { Button, CtaCard, GlassCard, Input, Modal, Select, StatCard, Switch } from '@/components/ui';
import { BarChart } from '@/components/charts/BarChart';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { useToast } from '@/components/Toast';
import { useSettings, useT } from '@/lib/settings-context';

const BG_PRESETS = [
  { id: 'aurora', swatch: 'linear-gradient(135deg,#dce8ff,#ffe3f1)' },
  { id: 'sunset', swatch: 'linear-gradient(135deg,#ffe4cc,#ffd3e0)' },
  { id: 'forest', swatch: 'linear-gradient(135deg,#dcf4e3,#e7f5d6)' },
  { id: 'mono', swatch: 'linear-gradient(135deg,#eceef2,#f1f1f3)' },
];

const ACCENT_PRESETS: { id: 'blue' | 'violet' | 'green' | 'orange' | 'pink' | 'teal'; hex: string }[] = [
  { id: 'blue', hex: '#0A84FF' },
  { id: 'violet', hex: '#7D5FFF' },
  { id: 'green', hex: '#34AA67' },
  { id: 'orange', hex: '#FF9500' },
  { id: 'pink', hex: '#FF4578' },
  { id: 'teal', hex: '#24AAAA' },
];

const BG_POSITIONS: { id: 'left' | 'center' | 'right' | 'top' | 'bottom'; labelKey: string }[] = [
  { id: 'left', labelKey: 'bgLeft' },
  { id: 'center', labelKey: 'bgCenter' },
  { id: 'right', labelKey: 'bgRight' },
  { id: 'top', labelKey: 'bgTop' },
  { id: 'bottom', labelKey: 'bgBottom' },
];

type Section = 'data' | 'settings' | 'security' | 'analytics' | null;

export default function ProfilePage() {
  const t = useT();
  const { settings } = useSettings();
  const [section, setSection] = useState<Section>(null);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <FolderCog size={22} className="text-accent" /> {t('profile', 'title')}
      </h1>

      <GlassCard className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-accent/15">
          {settings.profileImagePath ? (
            <Image src={settings.profileImagePath} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <User size={26} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" />
          )}
        </div>
        <div>
          <div className="text-base font-semibold">{settings.profileName || t('profile', 'yourName')}</div>
          <div className="text-xs text-secondary">
            {settings.city}, {settings.country}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CtaCard
          icon={<PieChart size={20} />}
          title={t('profile', 'analytics')}
          sub={t('profile', 'analyticsHint')}
          tone="pink"
          onClick={() => setSection('analytics')}
        />
        <CtaCard
          icon={<BarChart3 size={20} />}
          title={t('profile', 'dataAnalytics')}
          sub={t('profile', 'dataAnalyticsHint')}
          tone="blue"
          onClick={() => setSection('data')}
        />
        <CtaCard
          icon={<SettingsIcon size={20} />}
          title={t('profile', 'appSettings')}
          sub={t('profile', 'appSettingsHint')}
          tone="violet"
          onClick={() => setSection('settings')}
        />
        <CtaCard
          icon={<Shield size={20} />}
          title={t('profile', 'security')}
          sub={t('profile', 'securityHint')}
          tone={settings.pinEnabled ? 'green' : 'orange'}
          onClick={() => setSection('security')}
        />
      </div>

      <AnalyticsModal open={section === 'analytics'} onClose={() => setSection(null)} />
      <DataAnalyticsModal open={section === 'data'} onClose={() => setSection(null)} />
      <AppSettingsModal open={section === 'settings'} onClose={() => setSection(null)} />
      <SecurityModal open={section === 'security'} onClose={() => setSection(null)} />
    </div>
  );
}

interface SkillSummary {
  id: number;
  name: string;
  streak: number;
  totalMinutes: number;
}
interface QuranGoalSummary {
  id: number;
  achieved: boolean;
  memorizedAyahs: number;
  totalAyahs: number | null;
}
interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
  savings: number;
  byCategory: { category: string | null; total: number }[];
}
interface WeekDay {
  date: string;
  tasksDone: number;
  tasksTotal: number;
  prayersDone: number;
  prayersTotal: number;
}

function AnalyticsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const { data: dashboard } = useQuery({ queryKey: ['dashboard', todayStr()], queryFn: () => api.get<Dashboard>(`/api/dashboard?date=${todayStr()}`), enabled: open });
  const { data: week } = useQuery({
    queryKey: ['dashboard-week', todayStr()],
    queryFn: () => api.get<WeekDay[]>(`/api/dashboard/week?date=${todayStr()}`),
    enabled: open,
  });
  const { data: finance } = useQuery({ queryKey: ['finance-summary-all'], queryFn: () => api.get<FinanceSummary>('/api/finance/summary'), enabled: open });
  const { data: skills } = useQuery({ queryKey: ['skills'], queryFn: () => api.get<SkillSummary[]>('/api/skills'), enabled: open });
  const { data: quranGoals } = useQuery({ queryKey: ['quran-goals'], queryFn: () => api.get<QuranGoalSummary[]>('/api/religious/quran-goals'), enabled: open });

  const topStreak = (skills || []).reduce((max, s) => Math.max(max, s.streak), 0);
  const achievedGoals = (quranGoals || []).filter((g) => g.achieved).length;
  const totalMemorized = (quranGoals || []).reduce((sum, g) => sum + g.memorizedAyahs, 0);

  return (
    <Modal open={open} onClose={onClose} title={t('profile', 'analytics')} width="lg">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <BarChart3 size={14} /> {t('profile', 'allTimeFinance')}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label={t('dashboard', 'balance')} value={formatMoney(finance?.balance ?? 0)} />
            <StatCard label={t('dashboard', 'income')} value={formatMoney(finance?.income ?? 0)} tone="green" />
            <StatCard label={t('dashboard', 'expense')} value={formatMoney(finance?.expense ?? 0)} tone="red" />
            <StatCard label={t('finance', 'savings')} value={formatMoney(finance?.savings ?? 0)} tone="yellow" />
          </div>
        </div>

        {week && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={14} /> {t('profile', 'weeklyTrend')}
            </h3>
            <BarChart
              categories={week.map((d) => d.date.slice(5))}
              series={[
                { key: 'tasks', label: t('dashboard', 'tasksToday'), color: 'var(--series-1)', values: week.map((d) => d.tasksDone) },
                { key: 'prayers', label: t('dashboard', 'prayersToday'), color: 'var(--series-3)', values: week.map((d) => d.prayersDone) },
              ]}
            />
          </div>
        )}

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Trophy size={14} /> {t('profile', 'topicsProgress')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {(dashboard?.topicsStats || []).map((s) => (
              <div key={s.module} className="flex items-center gap-3 rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5">
                <ProgressRing value={s.done} total={s.total || 1} size={48} stroke={5} color="var(--series-1)" />
                <div>
                  <div className="text-sm font-semibold">{s.module === 'data_science' ? 'Data Science' : 'Ingliz tili'}</div>
                  <div className="text-xs text-secondary">
                    {s.done} / {s.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('profile', 'skillsOverview')}</h3>
            <StatCard label={t('profile', 'longestStreak')} value={`${topStreak}`} sub={t('education', 'streakDays')} tone="pink" />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('profile', 'quranOverview')}</h3>
            <StatCard label={t('religious', 'achievedSurahs')} value={`${achievedGoals} / ${quranGoals?.length || 0}`} sub={`${totalMemorized} ${t('religious', 'ayahUnit')}`} tone="violet" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DataAnalyticsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const [target, setTarget] = useState('schedule');
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [financeRange, setFinanceRange] = useState({ from: '', to: todayStr(), format: 'xlsx' });

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setImportResult(null);
    setImportError(null);
    const fd = new FormData();
    fd.append('target', target);
    fd.append('file', file);
    try {
      const res = await fetch('/api/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik');
      setImportResult(`${data.imported} ta qator import qilindi${data.skippedCount ? `, ${data.skippedCount} ta o'tkazib yuborildi` : ''}`);
      toast('Import yakunlandi');
    } catch (err) {
      setImportError((err as Error).message);
    }
  }

  function downloadFinance(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (financeRange.from) params.set('from', financeRange.from);
    if (financeRange.to) params.set('to', financeRange.to);
    params.set('format', financeRange.format);
    window.location.href = `/api/export/finance?${params.toString()}`;
  }

  return (
    <Modal open={open} onClose={onClose} title={t('profile', 'dataAnalytics')} width="lg">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-1 text-sm font-semibold">{t('profile', 'import')}</h3>
          <p className="mb-3 text-xs text-secondary">{t('profile', 'importHint')}</p>
          <form onSubmit={handleImport} className="flex flex-wrap items-center gap-2">
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="schedule">{t('education', 'importSchedule')}</option>
              <option value="todos">{t('education', 'importTodos')}</option>
            </Select>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm dark:border-white/10 dark:bg-black/20"
            />
            <Button type="submit">{t('common', 'add')}</Button>
          </form>
          {importResult && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-block rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-600">{importResult}</div>
              {target === 'todos' && (
                <a href="/todo">
                  <Button variant="secondary" className="px-3 py-1 text-xs">
                    {t('nav', 'todo')} →
                  </Button>
                </a>
              )}
            </div>
          )}
          {importError && <div className="mt-3 inline-block rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-600">{importError}</div>}
        </div>

        <div className="border-t border-black/5 pt-4 dark:border-white/5">
          <h3 className="mb-3 text-sm font-semibold">{t('profile', 'exportSchedule')}</h3>
          <div className="flex gap-2">
            <a href="/api/export/schedule?format=xlsx">
              <Button variant="secondary">Excel</Button>
            </a>
            <a href="/api/export/schedule?format=pdf">
              <Button variant="secondary">PDF</Button>
            </a>
            <a href="/api/export/schedule?format=docx">
              <Button variant="secondary">Word</Button>
            </a>
          </div>
        </div>

        <div className="border-t border-black/5 pt-4 dark:border-white/5">
          <h3 className="mb-3 text-sm font-semibold">{t('profile', 'financeReport')}</h3>
          <form onSubmit={downloadFinance} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              {t('profile', 'from')}: <Input type="date" value={financeRange.from} onChange={(e) => setFinanceRange({ ...financeRange, from: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              {t('profile', 'to')}: <Input type="date" value={financeRange.to} onChange={(e) => setFinanceRange({ ...financeRange, to: e.target.value })} />
            </label>
            <Select value={financeRange.format} onChange={(e) => setFinanceRange({ ...financeRange, format: e.target.value })}>
              <option value="xlsx">Excel</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
            </Select>
            <Button type="submit">{t('profile', 'downloadReport')}</Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}

type SettingsTab = 'profile' | 'appearance' | 'background' | 'region';

function AppSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const { settings, update } = useSettings();
  const [nameDraft, setNameDraft] = useState(settings.profileName || '');
  const [cityDraft, setCityDraft] = useState(settings.city);
  const [tab, setTab] = useState<SettingsTab>('profile');

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'profile', label: t('profile', 'settingsTabProfile') },
    { key: 'appearance', label: t('profile', 'settingsTabAppearance') },
    { key: 'background', label: t('profile', 'settingsTabBackground') },
    { key: 'region', label: t('profile', 'settingsTabRegion') },
  ];

  async function uploadImage(kind: 'background-image' | 'profile-image', file: File) {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`/api/settings/${kind}`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik');
      toast(t('profile', 'settingsSaved'));
    } catch (err) {
      toast((err as Error).message, true);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('profile', 'appSettings')} width="lg">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5',
              tab === tb.key ? 'bg-accent text-white' : 'glass text-[var(--text-primary)]',
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-accent/15">
            {settings.profileImagePath ? (
              <Image src={settings.profileImagePath} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <User size={26} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" />
            )}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Input placeholder={t('profile', 'nameFull')} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="max-w-[200px]" />
            <Button variant="secondary" onClick={() => update({ profileName: nameDraft })}>
              {t('common', 'save')}
            </Button>
            <label className="glass cursor-pointer rounded-full px-4 py-2 text-sm font-medium hover:bg-white/70 dark:hover:bg-white/10">
              {t('profile', 'profilePicture')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage('profile-image', e.target.files[0])} />
            </label>
          </div>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('profile', 'theme')}</span>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span>{t('profile', 'light')}</span>
              <Switch checked={settings.theme === 'dark'} onChange={(v) => update({ theme: v ? 'dark' : 'light' })} />
              <span>{t('profile', 'dark')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('profile', 'glassMode')}</span>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span>{t('profile', 'transparent')}</span>
              <Switch checked={settings.glassOpacity === 'opaque'} onChange={(v) => update({ glassOpacity: v ? 'opaque' : 'transparent' })} />
              <span>{t('profile', 'opaque')}</span>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">{t('profile', 'accentColor')}</span>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => update({ accentColor: a.id })}
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition hover:scale-110',
                    settings.accentColor === a.id ? 'border-[var(--text-primary)]' : 'border-transparent',
                  )}
                  style={{ background: a.hex }}
                  title={a.id}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">{t('profile', 'fontScale')}</span>
            <div className="flex gap-2">
              {(['sm', 'md', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => update({ fontScale: sz })}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5',
                    settings.fontScale === sz ? 'border-accent bg-accent/10 text-accent' : 'border-black/10 text-secondary dark:border-white/10',
                  )}
                  style={{ fontSize: sz === 'sm' ? 12 : sz === 'md' ? 14 : 16 }}
                >
                  {t('profile', sz === 'sm' ? 'fontSmall' : sz === 'md' ? 'fontMedium' : 'fontLarge')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'background' && (
        <div>
          <span className="mb-2 block text-sm font-medium">{t('profile', 'background')}</span>
          <p className="mb-2 text-xs text-secondary">{t('profile', 'backgroundHint')}</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {BG_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => update({ backgroundType: 'preset', backgroundPresetId: p.id })}
                className={clsx(
                  'h-10 w-10 rounded-xl border-2 transition hover:scale-105',
                  settings.backgroundType === 'preset' && settings.backgroundPresetId === p.id ? 'border-accent' : 'border-transparent',
                )}
                style={{ background: p.swatch }}
              />
            ))}
            {settings.backgroundType === 'custom' && settings.backgroundImagePath && (
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border-2 border-accent">
                <Image
                  src={settings.backgroundImagePath}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                  style={{ objectPosition: settings.backgroundPosition }}
                />
              </div>
            )}
          </div>
          <label className="glass inline-block cursor-pointer rounded-full px-4 py-2 text-sm font-medium hover:bg-white/70 dark:hover:bg-white/10">
            {t('profile', 'uploadFromGallery')}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage('background-image', e.target.files[0])} />
          </label>

          {settings.backgroundType === 'custom' && settings.backgroundImagePath && (
            <div className="mt-3">
              <span className="mb-1.5 block text-xs font-medium text-secondary">{t('profile', 'bgPosition')}</span>
              <div className="flex flex-wrap gap-1.5">
                {BG_POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => update({ backgroundPosition: p.id })}
                    className={clsx(
                      'rounded-full border px-3 py-1 text-xs font-medium transition hover:-translate-y-0.5',
                      settings.backgroundPosition === p.id ? 'border-accent bg-accent/10 text-accent' : 'border-black/10 text-secondary dark:border-white/10',
                    )}
                  >
                    {t('profile', p.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'region' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('profile', 'language')}</span>
            <Select value={settings.language} onChange={(e) => update({ language: e.target.value as any })} className="w-36">
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('profile', 'city')}</span>
            <div className="flex items-center gap-2">
              <Input value={cityDraft} onChange={(e) => setCityDraft(e.target.value)} className="w-36" />
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => update({ city: cityDraft })} disabled={cityDraft === settings.city}>
                {t('common', 'save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function SecurityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const { settings, update } = useSettings();
  const [newPin, setNewPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const setPinMutation = useMutation({
    mutationFn: (pin: string) => api.post('/api/settings/pin', { pin }),
    onSuccess: () => {
      toast(t('profile', 'pinSetOk'));
      setNewPin('');
      update({ pinEnabled: true });
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const disablePinMutation = useMutation({
    mutationFn: (pin: string) => api.post('/api/settings/pin/disable', { pin }),
    onSuccess: () => {
      toast(t('profile', 'pinDisabledOk'));
      setCurrentPin('');
      update({ pinEnabled: false });
    },
    onError: () => toast(t('profile', 'pinWrong'), true),
  });

  const importBackupMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const parsed = JSON.parse(text);
      return api.post('/api/backup/import', parsed);
    },
    onSuccess: () => toast(t('profile', 'backupRestored')),
    onError: (e) => toast((e as Error).message, true),
  });

  function handleToggle(v: boolean) {
    if (v) {
      // enabling requires setting a PIN first via the form below
      return;
    }
    if (currentPin.length !== 4) {
      toast(t('profile', 'pinInvalid'), true);
      return;
    }
    disablePinMutation.mutate(currentPin);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm(t('profile', 'backupImportConfirm'))) {
      e.target.value = '';
      return;
    }
    importBackupMutation.mutate(file);
    e.target.value = '';
  }

  return (
    <Modal open={open} onClose={onClose} title={t('profile', 'security')} width="md">
      <div className="flex flex-col gap-6">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Lock size={14} /> {t('profile', 'pinLock')}
            </span>
            <Switch checked={settings.pinEnabled} onChange={handleToggle} />
          </div>
          <p className="mb-3 text-xs text-secondary">{t('profile', 'pinLockHint')}</p>

          {!settings.pinEnabled ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\d{4}$/.test(newPin)) {
                  toast(t('profile', 'pinInvalid'), true);
                  return;
                }
                setPinMutation.mutate(newPin);
              }}
              className="flex items-center gap-2"
            >
              <Input
                inputMode="numeric"
                maxLength={4}
                placeholder={t('profile', 'newPinPlaceholder')}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-40"
              />
              <Button type="submit">{t('profile', 'setPin')}</Button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleToggle(false);
              }}
              className="flex items-center gap-2"
            >
              <Input
                inputMode="numeric"
                maxLength={4}
                placeholder={t('profile', 'currentPinPlaceholder')}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-48"
              />
              <Button type="submit" variant="danger">
                {t('common', 'delete')}
              </Button>
            </form>
          )}

          {settings.pinEnabled && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-medium text-secondary">{t('profile', 'pinLockTiming')}</span>
              <Select value={settings.pinLockTimeout} onChange={(e) => update({ pinLockTimeout: e.target.value as any })} className="w-48">
                <option value="immediate">{t('profile', 'pinLockImmediate')}</option>
                <option value="1m">{t('profile', 'pinLock1m')}</option>
                <option value="1h">{t('profile', 'pinLock1h')}</option>
              </Select>
            </div>
          )}
        </div>

        <div className="border-t border-black/5 pt-4 dark:border-white/5">
          <h3 className="mb-1 text-sm font-semibold">{t('profile', 'backup')}</h3>
          <p className="mb-3 text-xs text-secondary">{t('profile', 'backupHint')}</p>
          <div className="flex flex-wrap gap-2">
            <a href="/api/backup/export">
              <Button variant="secondary">
                <Download size={14} className="mr-1 inline" /> {t('profile', 'backupExport')}
              </Button>
            </a>
            <Button variant="secondary" onClick={() => importInputRef.current?.click()}>
              <Upload size={14} className="mr-1 inline" /> {t('profile', 'backupImport')}
            </Button>
            <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
