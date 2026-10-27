import { DAY_NAMES_UZ } from './util';

export interface ParsedScheduleRow {
  dayOfWeek: number | null;
  subject: string;
  startTime: string;
  endTime: string | null;
  room: string | null;
  confirmed: boolean;
}

const DAY_ALIASES: Record<string, number> = {};
DAY_NAMES_UZ.forEach((name, idx) => {
  DAY_ALIASES[name.toLowerCase()] = idx;
  DAY_ALIASES[name.toLowerCase().slice(0, 2)] = idx;
  DAY_ALIASES[name.toLowerCase().slice(0, 3)] = idx;
});
Object.assign(DAY_ALIASES, {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
  понедельник: 0, вторник: 1, среда: 2, четверг: 3, пятница: 4, суббота: 5, воскресенье: 6,
});

function matchDay(line: string): number | null {
  const normalized = line.trim().toLowerCase().replace(/[^a-zа-яʻ'\s]/gi, '');
  for (const [alias, idx] of Object.entries(DAY_ALIASES)) {
    if (normalized === alias || normalized.startsWith(alias + ' ') || normalized.startsWith(alias)) {
      if (alias.length >= 2) return idx;
    }
  }
  return null;
}

const TIME_RE = /(\d{1,2})[:.](\d{2})/g;

export function parseScheduleText(raw: string): ParsedScheduleRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: ParsedScheduleRow[] = [];
  let currentDay: number | null = null;

  for (const line of lines) {
    const dayOnly = matchDay(line);
    const times = [...line.matchAll(TIME_RE)];

    if (dayOnly !== null && times.length === 0 && line.length < 20) {
      currentDay = dayOnly;
      continue;
    }

    if (times.length === 0) continue;

    const startTime = `${times[0][1].padStart(2, '0')}:${times[0][2]}`;
    const endTime = times[1] ? `${times[1][1].padStart(2, '0')}:${times[1][2]}` : null;

    let subject = line
      .replace(TIME_RE, '')
      .replace(/[-–—]/g, ' ')
      .trim();

    const roomMatch = subject.match(/(?:xona|ауд|room|каб)\.?\s*[-:]?\s*(\w+)/i);
    const room = roomMatch ? roomMatch[1] : null;
    if (roomMatch) subject = subject.replace(roomMatch[0], '').trim();

    const lineDay = matchDay(line.split(/\d/)[0] || '') ?? dayOnly;
    const dayOfWeek = lineDay !== null ? lineDay : currentDay;

    subject = subject.replace(/^[,.\s]+|[,.\s]+$/g, '');
    if (!subject) subject = '—';

    rows.push({ dayOfWeek, subject, startTime, endTime, room, confirmed: dayOfWeek !== null });
  }

  return rows;
}
