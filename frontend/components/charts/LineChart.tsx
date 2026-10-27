'use client';

import { useRef, useState } from 'react';

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

export function LineChart({
  categories,
  series,
  height = 180,
  valueFormatter = (v: number) => String(v),
}: {
  categories: string[];
  series: LineSeries[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const width = Math.max(categories.length * 42, 280);
  const padding = { top: 16, right: 12, bottom: 24, left: 12 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const min = Math.min(0, ...series.flatMap((s) => s.values));
  const range = max - min || 1;
  const stepX = categories.length > 1 ? plotW / (categories.length - 1) : 0;

  const pointAt = (values: number[], i: number) => ({
    x: padding.left + i * stepX,
    y: padding.top + plotH - ((values[i] - min) / range) * plotH,
  });

  const pathFor = (values: number[]) =>
    values.map((_, i) => `${i === 0 ? 'M' : 'L'} ${pointAt(values, i).x} ${pointAt(values, i).y}`).join(' ');

  const areaFor = (values: number[]) => {
    const line = pathFor(values);
    const last = pointAt(values, values.length - 1);
    const first = pointAt(values, 0);
    return `${line} L ${last.x} ${padding.top + plotH} L ${first.x} ${padding.top + plotH} Z`;
  };

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - padding.left;
    const idx = Math.round(x / (stepX || 1));
    setHover(Math.max(0, Math.min(categories.length - 1, idx)));
  }

  return (
    <div className="relative overflow-x-auto">
      <svg ref={svgRef} width={width} height={height} className="block">
        {[0, 0.5, 1].map((t) => {
          const y = padding.top + plotH * (1 - t);
          return <line key={t} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth={1} />;
        })}
        {series.map((s) => (
          <path key={`area-${s.key}`} d={areaFor(s.values)} fill={s.color} opacity={0.08} />
        ))}
        {series.map((s) => (
          <path key={s.key} d={pathFor(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {hover !== null && (
          <line
            x1={padding.left + hover * stepX}
            x2={padding.left + hover * stepX}
            y1={padding.top}
            y2={padding.top + plotH}
            stroke="var(--chart-axis)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        {hover !== null &&
          series.map((s) => {
            const p = pointAt(s.values, hover);
            return <circle key={s.key} cx={p.x} cy={p.y} r={4} fill={s.color} stroke="var(--chart-surface)" strokeWidth={2} />;
          })}
        {categories.map((cat, i) =>
          i % Math.ceil(categories.length / 7 || 1) === 0 ? (
            <text key={cat} x={padding.left + i * stepX} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--chart-ink-muted)">
              {cat}
            </text>
          ) : null,
        )}
        <rect
          x={padding.left}
          y={padding.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>
      {hover !== null && (
        <div
          className="glass pointer-events-none absolute z-10 rounded-lg px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(padding.left + hover * stepX + 10, width - 150), top: 4 }}
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
