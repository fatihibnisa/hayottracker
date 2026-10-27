'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  BookMarked,
  BookOpenText,
  CheckCircle2,
  Mic2,
  Moon as MoonIcon,
  Plus,
  ScrollText,
  Target,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PrayerStatus, QuranLog } from '@/lib/types';
import { formatDateUz, PRAYER_LABELS, todayStr } from '@/lib/util';
import { Button, CtaCard, EmptyState, Input, Modal, Pill, Select, StatCard, Textarea } from '@/components/ui';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { AYAHS_PER_SESSION_OPTIONS, surahByNumber } from '@/lib/quran-data';
import { SurahPicker } from '@/components/SurahPicker';
import { LineChart } from '@/components/charts/LineChart';
import { VoiceQuranCheck } from '@/components/VoiceQuranCheck';
import { PrayerTimerHero } from '@/components/PrayerTimerHero';
import { hadithOfTheDay } from '@/lib/hadith-data';
import { HadithDetailModal } from '@/components/HadithDetailModal';
import { useToast } from '@/components/Toast';
import { useSettings, useT } from '@/lib/settings-context';
import { currentPrayerStatus, nextPrayer, PRAYER_ORDER, PrayerTimes } from '@/lib/prayer-utils';

const order: (PrayerStatus | null)[] = [null, 'green', 'yellow', 'red'];
const dotClass: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  none: 'bg-black/10 dark:bg-white/10',
};
const dotIcon: Record<string, string> = { green: '🟢', yellow: '🟡', red: '🔴', none: '—' };

interface QuranGoal {
  id: number;
  reference: string;
  referenceText: string | null;
  targetDate: string | null;
  surahNumber: number | null;
  totalAyahs: number | null;
  memorizedAyahs: number;
  ayahsPerSession: number;
  achieved: boolean;
  createdAt: string;
  achievedAt: string | null;
}

interface HadithSummary {
  id: number;
  number: number;
  bookName: string;
  link: string;
  status: 'new' | 'reading' | 'memorized';
  streak: number;
  sessionsCount: number;
}

type Section = 'hadis' | 'namoz' | 'quran' | null;

export default function ReligiousPage() {
  const date = todayStr();
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { settings } = useSettings();
  const [section, setSection] = useState<Section>(null);
  const [openHadithId, setOpenHadithId] = useState<number | null>(null);
  const [hadithStatusFilter, setHadithStatusFilter] = useState<'all' | 'new' | 'reading' | 'memorized'>('all');
  const [hadithSearch, setHadithSearch] = useState('');

  const prayersKey = ['prayers', date];
  const prayers = useQuery({
    queryKey: prayersKey,
    queryFn: () => api.get<{ name: string; status: PrayerStatus | null }[]>(`/api/religious/prayers/${date}`),
  });
  const quran = useQuery({ queryKey: ['quran'], queryFn: () => api.get<QuranLog[]>('/api/religious/quran') });
  const goals = useQuery({ queryKey: ['quran-goals'], queryFn: () => api.get<QuranGoal[]>('/api/religious/quran-goals') });
  const timings = useQuery({
    queryKey: ['prayer-times', date, settings.city, settings.country],
    queryFn: () => api.get<PrayerTimes & { date: string }>(`/api/religious/prayer-times?date=${date}&city=${encodeURIComponent(settings.city)}&country=${encodeURIComponent(settings.country)}`),
    staleTime: 60 * 60 * 1000,
  });

  const hadithStats = useQuery({ queryKey: ['hadith-stats'], queryFn: () => api.get<{ total: number; memorized: number; reading: number; topStreak: number }>('/api/hadith/stats') });
  const hadithList = useQuery({
    queryKey: ['hadith-list', hadithStatusFilter, hadithSearch],
    queryFn: () =>
      api.get<HadithSummary[]>(
        `/api/hadith?${hadithStatusFilter !== 'all' ? `status=${hadithStatusFilter}&` : ''}${hadithSearch ? `q=${encodeURIComponent(hadithSearch)}` : ''}`,
      ),
    enabled: section === 'hadis',
  });
  const seedHadith = useMutation({
    mutationFn: () => api.post('/api/hadith/seed', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hadith-stats'] });
      qc.invalidateQueries({ queryKey: ['hadith-list'] });
    },
  });

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const setPrayer = useMutation({
    mutationFn: (vars: { name: string; status: PrayerStatus }) => api.put(`/api/religious/prayers/${date}/${vars.name}`, { status: vars.status }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: prayersKey });
      const previous = qc.getQueryData<{ name: string; status: PrayerStatus | null }[]>(prayersKey);
      qc.setQueryData<{ name: string; status: PrayerStatus | null }[]>(prayersKey, (old) => old?.map((p) => (p.name === vars.name ? { ...p, status: vars.status } : p)));
      return { previous };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(prayersKey, ctx.previous);
      toast((e as Error).message, true);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prayersKey });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function cyclePrayer(name: string, current: PrayerStatus | null) {
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length] || 'green';
    setPrayer.mutate({ name, status: next });
  }

  function startPrayer(name: (typeof PRAYER_ORDER)[number]) {
    if (!timings.data) return;
    const result = currentPrayerStatus(timings.data, name, now);
    if (result === 'too-early') {
      toast(t('religious', 'tooEarly'), true);
      return;
    }
    setPrayer.mutate({ name, status: result === 'on-time' ? 'green' : 'yellow' });
  }

  const [form, setForm] = useState({ reference: '', amount: '', date });
  const addQuran = useMutation({
    mutationFn: () => api.post('/api/religious/quran', form),
    onSuccess: () => {
      toast(t('common', 'added'));
      setForm({ reference: '', amount: '', date });
      qc.invalidateQueries({ queryKey: ['quran'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const removeQuran = useMutation({
    mutationFn: (id: number) => api.del(`/api/religious/quran/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quran'] }),
  });

  const [goalForm, setGoalForm] = useState({ surahNumber: '', referenceText: '', targetDate: '', ayahsPerSession: 5 });
  const addGoal = useMutation({
    mutationFn: () => {
      const surah = surahByNumber(Number(goalForm.surahNumber));
      return api.post('/api/religious/quran-goals', {
        reference: surah ? `${surah.number}. ${surah.nameUz}` : '',
        referenceText: goalForm.referenceText || undefined,
        targetDate: goalForm.targetDate || undefined,
        surahNumber: surah?.number,
        totalAyahs: surah?.ayahCount,
        ayahsPerSession: goalForm.ayahsPerSession,
      });
    },
    onSuccess: () => {
      toast(t('common', 'added'));
      setGoalForm({ surahNumber: '', referenceText: '', targetDate: '', ayahsPerSession: 5 });
      qc.invalidateQueries({ queryKey: ['quran-goals'] });
    },
    onError: (e) => toast((e as Error).message, true),
  });
  const achieveGoal = useMutation({
    mutationFn: (id: number) => api.put(`/api/religious/quran-goals/${id}/achieve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quran-goals'] }),
  });
  const addGoalProgress = useMutation({
    mutationFn: (id: number) => api.post(`/api/religious/quran-goals/${id}/progress`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quran-goals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast((e as Error).message, true),
  });
  const removeGoal = useMutation({
    mutationFn: (id: number) => api.del(`/api/religious/quran-goals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quran-goals'] }),
  });

  const [voiceGoalId, setVoiceGoalId] = useState<number | null>(null);

  async function submitVoiceResult(goalId: number, reference: string, score: number, transcript: string) {
    try {
      await api.post('/api/religious/quran', { reference, amount: transcript.slice(0, 60), date: todayStr(), matchScore: score });
      toast(`${t('religious', 'matchScore')}: ${score}%`);
      qc.invalidateQueries({ queryKey: ['quran'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      if (score >= 80) achieveGoal.mutate(goalId);
    } catch (e) {
      toast((e as Error).message, true);
    }
  }

  const next = timings.data ? nextPrayer(timings.data, now) : null;

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const quranByDay = last14.map((d) => (quran.data || []).filter((q) => q.date === d).length);

  const prayersDoneToday = (prayers.data || []).filter((p) => p.status === 'green').length;
  const hadith = hadithOfTheDay();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <MoonIcon size={22} className="text-accent" fill="currentColor" /> {t('religious', 'title')}
      </h1>

      {timings.data && <PrayerTimerHero times={timings.data} now={now} t={t} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CtaCard icon={<ScrollText size={20} />} title={t('religious', 'hadis')} sub={t('religious', 'hadithOfDay')} tone="yellow" onClick={() => setSection('hadis')} />
        <CtaCard
          icon={<MoonIcon size={20} />}
          title={t('religious', 'prayersToday')}
          sub={`${prayersDoneToday} / 5${next ? ` · ${PRAYER_LABELS[next.key]}` : ''}`}
          onClick={() => setSection('namoz')}
        />
        <CtaCard
          icon={<BookOpenText size={20} />}
          title={t('religious', 'quran')}
          sub={`${(quran.data || []).length} ${t('dashboard', 'entriesToday')}`}
          tone="violet"
          onClick={() => setSection('quran')}
        />
      </div>

      <Modal open={section === 'hadis'} onClose={() => setSection(null)} title={t('religious', 'hadisReadingTitle')} width="lg">
        <div className="flex flex-col gap-5">
          <div className="islamic-pattern rounded-2xl p-6 text-center">
            <div dir="rtl" className="mb-4 text-2xl font-semibold leading-loose text-[var(--text-primary)]">
              {hadith.arabic}
            </div>
            <p className="mb-3 text-sm text-[var(--text-primary)]">{hadith.uz}</p>
            <Pill tone="gray">{hadith.source}</Pill>
          </div>

          <div>
            <p className="mb-3 text-xs text-secondary">{t('religious', 'hadithCollectionHint')}</p>

            {!hadithStats.data || hadithStats.data.total === 0 ? (
              <Button onClick={() => seedHadith.mutate()} disabled={seedHadith.isPending}>
                <BookMarked size={14} className="mr-1 inline" /> {t('religious', 'loadHadithCollection')}
              </Button>
            ) : (
              <>
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label={t('religious', 'totalHadithLabel')} value={String(hadithStats.data.total)} />
                  <StatCard label={t('religious', 'memorizedHadithLabel')} value={String(hadithStats.data.memorized)} tone="green" />
                  <StatCard label={t('religious', 'reading')} value={String(hadithStats.data.reading)} tone="yellow" />
                  <StatCard label={t('profile', 'longestStreak')} value={String(hadithStats.data.topStreak)} sub={t('education', 'streakDays')} tone="pink" />
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    placeholder={t('religious', 'jumpToNumber')}
                    value={hadithSearch}
                    onChange={(e) => setHadithSearch(e.target.value)}
                    className="w-40"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'new', 'reading', 'memorized'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setHadithStatusFilter(f)}
                        className={clsx(
                          'rounded-full border px-3 py-1 text-xs font-medium transition hover:-translate-y-0.5',
                          hadithStatusFilter === f ? 'border-accent bg-accent/10 text-accent' : 'border-black/10 text-secondary dark:border-white/10',
                        )}
                      >
                        {f === 'all' ? t('religious', 'statusAll') : f === 'new' ? t('religious', 'statusNew') : f === 'reading' ? t('religious', 'reading') : t('religious', 'achieved')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid max-h-72 grid-cols-10 gap-1.5 overflow-y-auto rounded-2xl bg-black/[0.02] p-3 dark:bg-white/[0.03] sm:grid-cols-14">
                  {(hadithList.data || []).map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setOpenHadithId(h.id)}
                      title={`${h.number}-hadis`}
                      className={clsx(
                        'flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-semibold transition hover:scale-110',
                        h.status === 'memorized' && 'bg-green-500/80 text-white',
                        h.status === 'reading' && 'cta-tone-yellow',
                        h.status === 'new' && 'bg-black/5 text-secondary dark:bg-white/10',
                      )}
                    >
                      {h.number}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      <HadithDetailModal hadithId={openHadithId} onClose={() => setOpenHadithId(null)} />

      <Modal open={section === 'namoz'} onClose={() => setSection(null)} title={t('religious', 'prayersToday')} width="lg">
        <p className="mb-3 text-xs text-secondary">
          {settings.city}, {settings.country} {timings.data && `· ${timings.data.fajr}–${timings.data.isha}`}
        </p>
        <div className="flex flex-col">
          {(prayers.data || []).map((p) => (
            <div key={p.name} className="flex items-center justify-between gap-3 border-b border-black/5 py-2.5 last:border-none dark:border-white/5">
              <span className="w-20 text-sm font-medium">{PRAYER_LABELS[p.name]}</span>
              <span className="flex-1 text-xs text-secondary">
                {timings.data && PRAYER_ORDER.includes(p.name as any) ? timeRangeFor(p.name, timings.data) : ''}
              </span>
              <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => startPrayer(p.name as any)}>
                {t('religious', 'startPrayer')}
              </Button>
              <button
                onClick={() => cyclePrayer(p.name, p.status)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white transition active:scale-90 ${dotClass[p.status || 'none']}`}
                title="Qo'lda belgilash"
              >
                {dotIcon[p.status || 'none']}
              </button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={section === 'quran'} onClose={() => setSection(null)} title={t('religious', 'quranMemorization')} width="lg">
        {quranByDay.some((v) => v > 0) && (
          <div className="mb-4">
            <h3 className="mb-1 text-xs font-semibold text-secondary">{t('religious', 'progressChart')}</h3>
            <LineChart
              categories={last14.map((d) => formatDateUz(d).slice(0, 5))}
              series={[{ key: 'entries', label: t('religious', 'log'), color: 'var(--series-7)', values: quranByDay }]}
              height={130}
            />
          </div>
        )}

        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">{t('religious', 'goals')}</h3>

          {goals.data && goals.data.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-3">
              <StatCard label={t('religious', 'activeGoals')} value={String(goals.data.filter((g) => !g.achieved).length)} />
              <StatCard label={t('religious', 'achievedSurahs')} value={String(goals.data.filter((g) => g.achieved).length)} />
              <StatCard
                label={t('religious', 'totalMemorizedAyahs')}
                value={`${goals.data.reduce((sum, g) => sum + g.memorizedAyahs, 0)}`}
                sub={t('religious', 'ayahUnit')}
              />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addGoal.mutate();
            }}
            className="mb-4 flex flex-col gap-2 rounded-2xl bg-black/[0.02] p-3 dark:bg-white/[0.03]"
          >
            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
              <SurahPicker
                value={goalForm.surahNumber ? Number(goalForm.surahNumber) : null}
                onChange={(n) => setGoalForm({ ...goalForm, surahNumber: String(n) })}
                placeholder={t('religious', 'selectSurah')}
                searchPlaceholder={t('religious', 'searchSurah')}
                ayahUnit={t('religious', 'ayahUnit')}
              />
              <label className="flex items-center gap-2 text-xs text-secondary">
                {t('religious', 'ayahsPerSession')}:
                <Select value={goalForm.ayahsPerSession} onChange={(e) => setGoalForm({ ...goalForm, ayahsPerSession: Number(e.target.value) })} className="w-20">
                  {AYAHS_PER_SESSION_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </label>
              <Input type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} />
              <Button type="submit" disabled={!goalForm.surahNumber}>
                <Target size={14} className="mr-1 inline" /> {t('religious', 'newGoal')}
              </Button>
            </div>
            <Textarea
              dir="rtl"
              rows={2}
              placeholder={t('religious', 'referenceTextPlaceholder')}
              value={goalForm.referenceText}
              onChange={(e) => setGoalForm({ ...goalForm, referenceText: e.target.value })}
            />
          </form>

          {!goals.data || goals.data.length === 0 ? (
            <EmptyState>{t('religious', 'noGoals')}</EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {goals.data.map((g) => {
                const surah = surahByNumber(g.surahNumber);
                return (
                  <div
                    key={g.id}
                    className={clsx(
                      'rounded-2xl border p-4 transition',
                      g.achieved
                        ? 'border-green-500/25 bg-green-500/[0.05]'
                        : 'border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.03]',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {g.totalAyahs != null ? (
                        <ProgressRing value={g.memorizedAyahs} total={g.totalAyahs} size={56} stroke={6} color="var(--series-7)" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                          <BookMarked size={22} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{g.reference}</span>
                          {surah && (
                            <span dir="rtl" className="text-base text-secondary">
                              {surah.nameArabic}
                            </span>
                          )}
                          {g.achieved && (
                            <Pill tone="green">
                              <CheckCircle2 size={11} className="mr-0.5 -mt-0.5 inline" />
                              {t('religious', 'achieved')}
                            </Pill>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
                          {g.totalAyahs != null && (
                            <span>
                              {g.memorizedAyahs} / {g.totalAyahs} {t('religious', 'ayahUnit')}
                            </span>
                          )}
                          {g.targetDate && (
                            <span>
                              {t('religious', 'deadline')}: {formatDateUz(g.targetDate)}
                            </span>
                          )}
                        </div>

                        {!g.achieved && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => addGoalProgress.mutate(g.id)}>
                              <Plus size={12} className="mr-1 inline" />
                              {g.ayahsPerSession} {t('religious', 'ayahUnit')}
                            </Button>
                            {g.referenceText && (
                              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setVoiceGoalId(voiceGoalId === g.id ? null : g.id)}>
                                <Mic2 size={12} className="mr-1 inline" />
                                {t('religious', 'voiceCheck')}
                              </Button>
                            )}
                            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => achieveGoal.mutate(g.id)}>
                              <CheckCircle2 size={12} className="mr-1 inline" />
                              {t('religious', 'markAchieved')}
                            </Button>
                          </div>
                        )}
                      </div>

                      <button onClick={() => removeGoal.mutate(g.id)} className="shrink-0 text-red-500/60 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {voiceGoalId === g.id && g.referenceText && (
                      <div className="mt-3 border-t border-black/5 pt-3 dark:border-white/5">
                        <VoiceQuranCheck referenceText={g.referenceText} onResult={(score, transcript) => submitVoiceResult(g.id, g.reference, score, transcript)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <h3 className="mb-2 text-sm font-semibold">{t('religious', 'log')}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addQuran.mutate();
          }}
          className="mb-3 flex flex-wrap items-center gap-2"
        >
          <Input placeholder={t('religious', 'referencePlaceholder')} required value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="flex-1" />
          <Input placeholder="5 oyat" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Button type="submit">{t('common', 'add')}</Button>
        </form>
        {!quran.data || quran.data.length === 0 ? (
          <EmptyState>{t('religious', 'noLog')}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-secondary">
                <th className="py-2">{t('common', 'date')}</th>
                <th className="py-2">{t('religious', 'quran')}</th>
                <th className="py-2">{t('religious', 'matchScore')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quran.data.map((q) => (
                <tr key={q.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="py-2">{formatDateUz(q.date)}</td>
                  <td className="py-2">{q.reference}</td>
                  <td className="py-2">{q.matchScore != null ? `${q.matchScore}%` : '-'}</td>
                  <td className="py-2">
                    <button onClick={() => removeQuran.mutate(q.id)} className="text-red-500/70 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}

function timeRangeFor(name: string, times: PrayerTimes) {
  const map: Record<string, string> = {
    bomdod: `${times.fajr} – ${times.sunrise}`,
    peshin: `${times.dhuhr} – ${times.asr}`,
    asr: `${times.asr} – ${times.maghrib}`,
    shom: `${times.maghrib} – ${times.isha}`,
    hufton: `${times.isha} – ${times.fajr}`,
  };
  return map[name] || '';
}
