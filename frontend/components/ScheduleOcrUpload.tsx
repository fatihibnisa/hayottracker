'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { api } from '@/lib/api';
import { parseScheduleText, ParsedScheduleRow } from '@/lib/schedule-ocr';
import { DAY_NAMES_UZ } from '@/lib/util';
import { Button, GlassCard, Input, Select } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useT } from '@/lib/settings-context';

export function ScheduleOcrUpload() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<ParsedScheduleRow[] | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScanning(true);
    setProgress(0);
    setRows(null);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100));
        },
      });
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();
      const parsed = parseScheduleText(text);
      if (parsed.length === 0) {
        toast("Rasmdan dars jadvali topilmadi, qo'lda kiriting", true);
      } else {
        setRows(parsed);
      }
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setScanning(false);
    }
  }

  const bulkAdd = useMutation({
    mutationFn: async () => {
      const confirmed = (rows || []).filter((r) => r.confirmed && r.dayOfWeek !== null);
      for (const r of confirmed) {
        await api.post('/api/schedule', {
          day_of_week: r.dayOfWeek,
          subject: r.subject,
          start_time: r.startTime,
          end_time: r.endTime,
          room: r.room,
        });
      }
      return confirmed.length;
    },
    onSuccess: (count) => {
      toast(`${count} ta dars qo'shildi`);
      setRows(null);
      qc.invalidateQueries({ queryKey: ['schedule'] });
    },
    onError: (e) => toast((e as Error).message, true),
  });

  function updateRow(idx: number, patch: Partial<ParsedScheduleRow>) {
    setRows((prev) => prev && prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  return (
    <GlassCard>
      <h2 className="mb-1 text-base font-semibold">{t('education', 'uploadScheduleImage')}</h2>
      <p className="mb-3 text-xs text-secondary">{t('education', 'uploadScheduleHint')}</p>

      <label className="glass flex w-fit cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium hover:bg-white/70 dark:hover:bg-white/10">
        <ImagePlus size={16} />
        <span>{scanning ? t('education', 'scanning') : t('education', 'uploadScheduleImage')}</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={scanning} />
      </label>

      {scanning && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold">{t('education', 'reviewSuggestions')}</h3>
          <div className="flex flex-col gap-2">
            {rows.map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-black/[0.03] p-2 dark:bg-white/5">
                <input type="checkbox" checked={r.confirmed} onChange={(e) => updateRow(i, { confirmed: e.target.checked })} className="h-4 w-4 accent-accent" />
                <Select value={r.dayOfWeek ?? ''} onChange={(e) => updateRow(i, { dayOfWeek: e.target.value === '' ? null : Number(e.target.value) })}>
                  <option value="">—</option>
                  {DAY_NAMES_UZ.map((d, idx) => (
                    <option key={idx} value={idx}>
                      {d}
                    </option>
                  ))}
                </Select>
                <Input value={r.subject} onChange={(e) => updateRow(i, { subject: e.target.value })} className="min-w-[140px] flex-1" />
                <Input type="time" value={r.startTime} onChange={(e) => updateRow(i, { startTime: e.target.value })} className="w-28" />
                <Input type="time" value={r.endTime || ''} onChange={(e) => updateRow(i, { endTime: e.target.value || null })} className="w-28" />
                <Input placeholder="Xona" value={r.room || ''} onChange={(e) => updateRow(i, { room: e.target.value || null })} className="w-20" />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button onClick={() => bulkAdd.mutate()}>{t('education', 'addAllConfirmed')}</Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
