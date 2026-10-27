export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export const PRAYER_ORDER = ['bomdod', 'peshin', 'asr', 'shom', 'hufton'] as const;
export type PrayerKey = (typeof PRAYER_ORDER)[number];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToClock(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Returns [startMinutes, endMinutes) window for each prayer, in minutes since local midnight. */
export function prayerWindows(times: PrayerTimes): Record<PrayerKey, { start: number; end: number }> {
  const fajr = toMinutes(times.fajr);
  const sunrise = toMinutes(times.sunrise);
  const dhuhr = toMinutes(times.dhuhr);
  const asr = toMinutes(times.asr);
  const maghrib = toMinutes(times.maghrib);
  const isha = toMinutes(times.isha);

  return {
    bomdod: { start: fajr, end: sunrise },
    peshin: { start: dhuhr, end: asr },
    asr: { start: asr, end: maghrib },
    shom: { start: maghrib, end: isha },
    hufton: { start: isha, end: fajr + 1440 },
  };
}

export function currentPrayerStatus(
  times: PrayerTimes,
  prayer: PrayerKey,
  now: Date = new Date(),
): 'too-early' | 'on-time' | 'qaza' {
  const windows = prayerWindows(times);
  const w = windows[prayer];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let effectiveNow = nowMin;
  if (prayer === 'hufton' && nowMin < toMinutes(times.fajr)) effectiveNow += 1440;

  if (effectiveNow < w.start) return 'too-early';
  if (effectiveNow < w.end) return 'on-time';
  return 'qaza';
}

export function nextPrayer(times: PrayerTimes, now: Date = new Date()): { key: PrayerKey; at: number; inMinutes: number } {
  const windows = prayerWindows(times);
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  for (const key of PRAYER_ORDER) {
    const start = windows[key].start;
    if (start >= nowMin) {
      return { key, at: start, inMinutes: Math.ceil(start - nowMin) };
    }
  }
  const bomdodStart = windows.bomdod.start + 1440;
  return { key: 'bomdod', at: windows.bomdod.start, inMinutes: Math.ceil(bomdodStart - nowMin) };
}

export function formatCountdown(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  return h > 0 ? `${h}s ${m}d` : `${m}d`;
}
