export type PrayerStatus = 'green' | 'yellow' | 'red';
export type Period = 'daily' | 'weekly' | 'monthly';
export type ModuleType = 'data_science' | 'english';

export interface DayInfo {
  date: string;
  rating: number | null;
  note: string;
}

export interface Todo {
  id: number;
  title: string;
  period: Period;
  dueDate: string | null;
  time: string | null;
  done: boolean;
  sourceTopicId: number | null;
}

export interface Dashboard {
  date: string;
  balance: number;
  income: number;
  expense: number;
  todos: { done: number; total: number; items: Todo[] };
  prayers: { done: number; total: number; items: { name: string; status: PrayerStatus | null }[] };
  quran: QuranLog[];
  day: DayInfo;
  topicsStats: { module: ModuleType; total: number; done: number }[];
}

export interface ScheduleItem {
  id: number;
  dayOfWeek: number;
  subject: string;
  startTime: string;
  endTime: string | null;
  room: string | null;
}

export interface Topic {
  id: number;
  module: ModuleType;
  title: string;
  status: 'todo' | 'done';
  createdAt: string;
  completedAt: string | null;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string | null;
  amount: number;
  party: string | null;
  reason: string | null;
  date: string;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
  savings: number;
  byCategory: { category: string | null; total: number }[];
}

export interface QuranLog {
  id: number;
  date: string;
  reference: string;
  amount: string | null;
  matchScore?: number | null;
}
