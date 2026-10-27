'use client';

export interface RadarAxis {
  label: string;
  value: number; // 0-100
}

export function RadarChart({
  axes,
  color = 'var(--series-1)',
  size = 280,
}: {
  axes: RadarAxis[];
  color?: string;
  size?: number;
}) {
  if (axes.length < 3) return null;

  const n = axes.length;
  const labelPad = 52;
  const radius = size / 2 - labelPad;
  const cx = size / 2;
  const cy = size / 2;
  const angleStep = (2 * Math.PI) / n;

  function pointFor(i: number, pct: number): [number, number] {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (Math.max(0, Math.min(100, pct)) / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  const rings = [25, 50, 75, 100];
  const dataPoints = axes.map((a, i) => pointFor(i, a.value));
  const dataPath = dataPoints.map((p) => p.join(',')).join(' ');

  return (
    <svg width={size} height={size} role="img" aria-label="Ko'nikmalar radari">
      {rings.map((pct) => {
        const pts = axes.map((_, i) => pointFor(i, pct).join(',')).join(' ');
        return <polygon key={pct} points={pts} fill="none" stroke="var(--chart-grid)" strokeWidth={1} />;
      })}

      {axes.map((_, i) => {
        const [x, y] = pointFor(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--chart-grid)" strokeWidth={1} />;
      })}

      <polygon points={dataPath} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill={color} />
      ))}

      {axes.map((a, i) => {
        const [lx, ly] = pointFor(i, 124);
        const angle = -Math.PI / 2 + i * angleStep;
        const cos = Math.cos(angle);
        const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fill="var(--chart-ink-secondary)">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
