'use client';

import { currentPrayerStatus, nextPrayer, prayerWindows, PRAYER_ORDER, PrayerTimes } from '@/lib/prayer-utils';
import { PRAYER_LABELS } from '@/lib/util';

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0');
}

function formatHms(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function PrayerTimerHero({ times, now, t }: { times: PrayerTimes; now: Date; t: (ns: 'religious', key: string) => string }) {
  const windows = prayerWindows(times);
  const nowAbs = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  const activeKey = PRAYER_ORDER.find((key) => currentPrayerStatus(times, key, now) === 'on-time') || null;

  let elapsedPct = 0;
  let elapsedSeconds = 0;
  if (activeKey) {
    const w = windows[activeKey];
    let effectiveNow = nowAbs;
    if (activeKey === 'hufton' && nowAbs < windows.bomdod.start) effectiveNow += 1440;
    const duration = w.end - w.start;
    elapsedSeconds = Math.max(0, (effectiveNow - w.start) * 60);
    elapsedPct = duration > 0 ? Math.min(1, (effectiveNow - w.start) / duration) : 0;
  }

  const next = nextPrayer(times, now);
  let startAbs = windows[next.key].start;
  if (startAbs < nowAbs) startAbs += 1440;
  const secondsLeft = (startAbs - nowAbs) * 60;

  const size = 196;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - elapsedPct);

  return (
    <div className="islamic-pattern relative overflow-hidden rounded-xl2 p-6">
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div dir="rtl" className="text-lg font-medium text-accent/80">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        <div className="relative flex items-center justify-center text-accent" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
            {activeKey && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.4s linear' }}
              />
            )}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-[var(--text-primary)]">{formatHms(secondsLeft)}</span>
            <span className="mt-1 text-xs text-secondary">
              {PRAYER_LABELS[next.key]} {t('religious', 'untilNext')}
            </span>
          </div>
        </div>

        {activeKey ? (
          <div className="text-sm">
            <span className="font-semibold text-[var(--text-primary)]">{PRAYER_LABELS[activeKey]}</span>{' '}
            <span className="text-secondary">
              {t('religious', 'activeNow')} · {formatHms(elapsedSeconds)} {t('religious', 'elapsed')}
            </span>
          </div>
        ) : (
          <div className="text-sm text-secondary">{t('religious', 'betweenPrayers')}</div>
        )}
      </div>
    </div>
  );
}
