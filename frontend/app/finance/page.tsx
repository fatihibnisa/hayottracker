'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownCircle, ArrowUpCircle, Eye, EyeOff, PiggyBank, Trash2, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { FinanceSummary, Transaction } from '@/lib/types';
import { EXPENSE_CATEGORIES, formatDateUz, formatMoney, todayStr } from '@/lib/util';
import { Button, CtaCard, EmptyState, GlassCard, Input, Modal, Pill, Select, StatCard } from '@/components/ui';
import { LineChart } from '@/components/charts/LineChart';
import { useToast } from '@/components/Toast';
import { useT } from '@/lib/settings-context';

function AmountField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        step={1000}
        placeholder={t('common', 'amount')}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
      />
      <button
        type="button"
        onClick={() => onChange(value ? `${value}000` : '0')}
        title="000 qo'shish"
        className="shrink-0 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-secondary transition hover:-translate-y-0.5 hover:border-accent hover:text-accent active:scale-95 dark:border-white/10"
      >
        +000
      </button>
    </div>
  );
}

interface TrendPoint {
  date: string;
  income: number;
  expense: number;
}

export default function FinancePage() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const summary = useQuery({ queryKey: ['finance', 'summary'], queryFn: () => api.get<FinanceSummary>('/api/finance/summary') });
  const txs = useQuery({ queryKey: ['finance', 'transactions'], queryFn: () => api.get<Transaction[]>('/api/finance/transactions') });
  const trend = useQuery({ queryKey: ['finance', 'trend'], queryFn: () => api.get<TrendPoint[]>('/api/finance/trend?days=14') });

  const [modal, setModal] = useState<'income' | 'expense' | 'savings' | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [income, setIncome] = useState({ amount: '', party: '', reason: '', date: todayStr() });
  const [expense, setExpense] = useState({ amount: '', category: EXPENSE_CATEGORIES[0], party: '', reason: '', date: todayStr() });
  const [savings, setSavings] = useState({ amount: '', reason: '', date: todayStr() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['finance'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const addIncome = useMutation({
    mutationFn: () => api.post('/api/finance/transactions', { type: 'income', ...income, amount: Number(income.amount) }),
    onSuccess: () => {
      toast(t('common', 'added'));
      setIncome({ amount: '', party: '', reason: '', date: todayStr() });
      setModal(null);
      invalidate();
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const addExpense = useMutation({
    mutationFn: () => api.post('/api/finance/transactions', { type: 'expense', ...expense, amount: Number(expense.amount) }),
    onSuccess: () => {
      toast(t('common', 'added'));
      setExpense({ amount: '', category: EXPENSE_CATEGORIES[0], party: '', reason: '', date: todayStr() });
      setModal(null);
      invalidate();
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const addSavings = useMutation({
    mutationFn: () =>
      api.post('/api/finance/transactions', {
        type: 'expense',
        category: "Jamg'arma",
        amount: Number(savings.amount),
        reason: savings.reason,
        date: savings.date,
      }),
    onSuccess: () => {
      toast(t('common', 'added'));
      setSavings({ amount: '', reason: '', date: todayStr() });
      setModal(null);
      invalidate();
    },
    onError: (e) => toast((e as Error).message, true),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/api/finance/transactions/${id}`),
    onSuccess: invalidate,
  });

  const s = summary.data;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Wallet size={22} className="text-accent" /> {t('finance', 'title')}
      </h1>

      {s && (
        <>
          <GlassCard className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-secondary">{t('finance', 'balance')}</div>
              <div className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
                {showBalance ? formatMoney(s.balance) : '•••••••'}
              </div>
            </div>
            <button
              onClick={() => setShowBalance((v) => !v)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:-translate-y-0.5 hover:bg-black/5 active:scale-90 dark:hover:bg-white/10"
              aria-label="toggle balance visibility"
            >
              {showBalance ? <Eye size={18} className="text-secondary" /> : <EyeOff size={18} className="text-secondary" />}
            </button>
          </GlassCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label={t('finance', 'totalIncome')} value={showBalance ? formatMoney(s.income) : '•••••••'} tone="green" />
            <StatCard label={t('finance', 'totalExpense')} value={showBalance ? formatMoney(s.expense) : '•••••••'} tone="red" />
            <StatCard label={t('finance', 'savings')} value={showBalance ? formatMoney(s.savings) : '•••••••'} tone="yellow" />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CtaCard icon={<ArrowUpCircle size={20} />} title={t('finance', 'addIncome')} tone="green" onClick={() => setModal('income')} />
        <CtaCard icon={<ArrowDownCircle size={20} />} title={t('finance', 'addExpense')} tone="red" onClick={() => setModal('expense')} />
        <CtaCard icon={<PiggyBank size={20} />} title={t('finance', 'addSavings')} tone="violet" onClick={() => setModal('savings')} />
      </div>

      {trend.data && (
        <GlassCard>
          <h2 className="mb-3 text-base font-semibold">{t('finance', 'trend')}</h2>
          <LineChart
            categories={trend.data.map((p) => formatDateUz(p.date).slice(0, 5))}
            series={[
              { key: 'income', label: t('finance', 'typeIncome'), color: 'var(--series-3)', values: trend.data.map((p) => p.income) },
              { key: 'expense', label: t('finance', 'typeExpense'), color: 'var(--series-8)', values: trend.data.map((p) => p.expense) },
            ]}
            valueFormatter={(v) => formatMoney(v)}
          />
        </GlassCard>
      )}

      {s && (
        <GlassCard>
          <h2 className="mb-3 text-base font-semibold">{t('finance', 'byCategory')}</h2>
          {s.byCategory.length === 0 ? (
            <EmptyState>{t('finance', 'noExpense')}</EmptyState>
          ) : (
            s.byCategory.map((c) => (
              <div key={c.category} className="flex items-center justify-between border-b border-black/5 py-2 last:border-none dark:border-white/5">
                <span className="text-sm">{c.category}</span>
                <span className="text-sm font-semibold">{formatMoney(c.total)}</span>
              </div>
            ))
          )}
        </GlassCard>
      )}

      <GlassCard>
        <h2 className="mb-3 text-base font-semibold">{t('finance', 'recentTx')}</h2>
        {!txs.data || txs.data.length === 0 ? (
          <EmptyState>{t('finance', 'noTx')}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-secondary">
                <th className="py-2">{t('common', 'date')}</th>
                <th className="py-2">Turi</th>
                <th className="py-2">{t('finance', 'category')}</th>
                <th className="py-2">{t('common', 'amount')}</th>
                <th className="py-2">{t('finance', 'recipient')}</th>
                <th className="py-2">{t('finance', 'reason')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {txs.data.map((tx) => (
                <tr key={tx.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="py-2">{formatDateUz(tx.date)}</td>
                  <td className="py-2">
                    <Pill tone={tx.type === 'income' ? 'green' : 'red'}>{tx.type === 'income' ? t('finance', 'typeIncome') : t('finance', 'typeExpense')}</Pill>
                  </td>
                  <td className="py-2">{tx.category || '-'}</td>
                  <td className="py-2">{formatMoney(tx.amount)}</td>
                  <td className="py-2">{tx.party || '-'}</td>
                  <td className="py-2">{tx.reason || '-'}</td>
                  <td className="py-2">
                    <button onClick={() => remove.mutate(tx.id)} className="text-red-500/70 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      <Modal open={modal === 'income'} onClose={() => setModal(null)} title={t('finance', 'addIncome')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addIncome.mutate();
          }}
          className="flex flex-col gap-2"
        >
          <AmountField value={income.amount} onChange={(v) => setIncome({ ...income, amount: v })} />
          <Input placeholder={t('finance', 'source')} value={income.party} onChange={(e) => setIncome({ ...income, party: e.target.value })} />
          <Input placeholder={t('finance', 'reason')} value={income.reason} onChange={(e) => setIncome({ ...income, reason: e.target.value })} />
          <Input type="date" value={income.date} onChange={(e) => setIncome({ ...income, date: e.target.value })} />
          <Button type="submit">{t('common', 'add')}</Button>
        </form>
      </Modal>

      <Modal open={modal === 'expense'} onClose={() => setModal(null)} title={t('finance', 'addExpense')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addExpense.mutate();
          }}
          className="flex flex-col gap-2"
        >
          <AmountField value={expense.amount} onChange={(v) => setExpense({ ...expense, amount: v })} />
          <Select value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Input placeholder={t('finance', 'recipient')} value={expense.party} onChange={(e) => setExpense({ ...expense, party: e.target.value })} />
          <Input placeholder={t('finance', 'reason')} value={expense.reason} onChange={(e) => setExpense({ ...expense, reason: e.target.value })} />
          <Input type="date" value={expense.date} onChange={(e) => setExpense({ ...expense, date: e.target.value })} />
          <Button variant="secondary" type="submit">
            {t('common', 'add')}
          </Button>
        </form>
      </Modal>

      <Modal open={modal === 'savings'} onClose={() => setModal(null)} title={t('finance', 'addSavings')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addSavings.mutate();
          }}
          className="flex flex-col gap-2"
        >
          <AmountField value={savings.amount} onChange={(v) => setSavings({ ...savings, amount: v })} />
          <Input placeholder={t('finance', 'reason')} value={savings.reason} onChange={(e) => setSavings({ ...savings, reason: e.target.value })} />
          <Input type="date" value={savings.date} onChange={(e) => setSavings({ ...savings, date: e.target.value })} />
          <Button type="submit">{t('common', 'add')}</Button>
        </form>
      </Modal>
    </div>
  );
}
