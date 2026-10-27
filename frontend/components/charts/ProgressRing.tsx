'use client';

export function ProgressRing({
  value,
  total,
  size = 88,
  stroke = 10,
  color = 'var(--series-1)',
  label,
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-grid)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-base font-semibold">{Math.round(pct * 100)}%</span>
        {label && <span className="text-[10px] text-secondary">{label}</span>}
      </div>
    </div>
  );
}
