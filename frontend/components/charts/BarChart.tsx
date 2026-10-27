'use client';

import { useId, useState } from 'react';

export interface BarSeries {
  key: string;
  label: string;
  color: string; // css var, e.g. 'var(--series-1)'
  values: number[];
}

export function BarChart({
  categories,
  series,
  height = 180,
  valueFormatter = (v: number) => String(v),
}: {
  categories: string[];
  series: BarSeries[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const width = Math.max(categories.length * (series.length > 1 ? 54 : 40), 240);
  const padding = { top: 16, right: 8, bottom: 24, left: 8 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const groupW = plotW / categories.length;
  const barW = series.length > 1 ? Math.min(14, (groupW - 10) / series.length) : Math.min(22, groupW - 12);

  return (
    <div className="relative overflow-x-auto">
      <svg width={width} height={height} className="block">
        {/* gridlines */}
        {[0, 0.5, 1].map((t) => {
          const y = padding.top + plotH * (1 - t);
          return (
            <line key={t} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth={1} />
          );
        })}
        {categories.map((cat, i) => {
          const groupX = padding.left + i * groupW;
          const isHover = hover === i;
          return (
            <g key={cat}>
              <rect
                x={groupX}
                y={padding.top}
                width={groupW}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              />
              {isHover && <rect x={groupX} y={padding.top} width={groupW} height={plotH} fill="var(--chart-grid)" opacity={0.3} />}
              {series.map((s, si) => {
                const v = s.values[i] || 0;
                const h = max > 0 ? (v / max) * plotH : 0;
                const x = series.length > 1 ? groupX + groupW / 2 - (series.length * barW) / 2 + si * barW + 2 : groupX + groupW / 2 - barW / 2;
                const y = padding.top + plotH - h;
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={y}
                    width={barW - (series.length > 1 ? 2 : 0)}
                    height={Math.max(h, v > 0 ? 3 : 0)}
                    rx={4}
                    fill={s.color}
                    pointerEvents="none"
                  />
                );
              })}
              <text x={groupX + groupW / 2} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--chart-ink-muted)">
                {cat}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="glass pointer-events-none absolute z-10 rounded-lg px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(padding.left + hover * groupW + groupW / 2 + 8, width - 140), top: 4 }}
        >
          <div className="mb-1 font-semibold text-secondary">{categories[hover]}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span>
                {s.label}: <strong>{valueFormatter(s.values[hover] || 0)}</strong>
              </span>
            </div>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-secondary">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
