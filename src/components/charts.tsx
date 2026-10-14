import type { OrderStatus } from '@/types';
import { ORDER_STATUS, ORDER_STATUS_COLOR } from './Badge';

interface Point {
  label: string;
  value: number;
}

const niceMax = (max: number): number => {
  if (max <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

const PL = 36, PR = 8, PT = 10, PB = 22;

function Grid({ w, h, max, unit }: { w: number; h: number; max: number; unit: string }) {
  const ih = h - PT - PB;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = PT + ih - (ih / 4) * i;
        return (
          <g key={i}>
            <line x1={PL} x2={w - PR} y1={y} y2={y} stroke="var(--ln)" />
            <text x={PL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--ink3)">
              {i ? `${Math.round((max / 4) * i * 10) / 10}${unit}` : '0'}
            </text>
          </g>
        );
      })}
    </>
  );
}

/** Column chart. `labelEvery` thins out the x labels; bars at or above `highlight` are drawn solid. */
export function BarChart({ data, unit = 'tr', labelEvery = 1, highlight, height = 188, ariaLabel }: { data: Point[]; unit?: string; labelEvery?: number; highlight?: number; height?: number; ariaLabel: string }) {
  const w = 560;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const iw = w - PL - PR, ih = height - PT - PB, st = iw / Math.max(data.length, 1), bw = st * 0.56;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="img" aria-label={ariaLabel} preserveAspectRatio="none">
      <Grid w={w} h={height} max={max} unit={unit} />
      {data.map((d, i) => {
        const bh = Math.max(2, (d.value / max) * ih);
        return (
          <rect key={i} x={PL + st * i + (st - bw) / 2} y={PT + ih - bh} width={bw} height={bh} rx={3} fill="var(--g6)" opacity={highlight !== undefined && d.value >= highlight ? 1 : 0.7}>
            <title>{`${d.label}: ${d.value}${unit}`}</title>
          </rect>
        );
      })}
      {data.map((d, i) =>
        i % labelEvery === 0 ? (
          <text key={i} x={PL + st * i + st / 2} y={height - 5} textAnchor="middle" fontSize={10} fill="var(--ink3)">
            {d.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function LineChart({ data, unit = 'tr', height = 210, ariaLabel }: { data: Point[]; unit?: string; height?: number; ariaLabel: string }) {
  const w = 620;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const iw = w - PL - PR, ih = height - PT - PB;
  const pts = data.map((d, i) => [PL + (data.length > 1 ? i / (data.length - 1) : 0.5) * iw, PT + ih - (d.value / max) * ih] as const);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="img" aria-label={ariaLabel} preserveAspectRatio="none">
      <Grid w={w} h={height} max={max} unit={unit} />
      {pts.length > 0 && <path d={`${path} L ${pts[pts.length - 1][0]} ${PT + ih} L ${PL} ${PT + ih} Z`} fill="var(--g6)" opacity={0.12} />}
      <path d={path} fill="none" stroke="var(--g6)" strokeWidth={2.2} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={3} fill="var(--g6)">
            <title>{`${data[i].label}: ${data[i].value}${unit}`}</title>
          </circle>
          <text x={p[0]} y={height - 5} textAnchor="middle" fontSize={10} fill="var(--ink3)">
            {data[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Donut({ rows, total, unit }: { rows: { status: OrderStatus; pct: number }[]; total: number; unit: string }) {
  const R = 50, r = 35, cx = 58, cy = 58;
  let a = -Math.PI / 2;
  const P = (rad: number, an: number) => [cx + rad * Math.cos(an), cy + rad * Math.sin(an)] as const;
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 116 116" width={110} height={110} style={{ flex: '0 0 auto' }} role="img" aria-label="Tỷ lệ trạng thái đơn hàng">
        {rows.map((x) => {
          const sw = (x.pct / 100) * Math.PI * 2, gap = 0.045, s = a + gap / 2, e = a + sw - gap / 2, big = sw > Math.PI ? 1 : 0;
          const [x1, y1] = P(R, s), [x2, y2] = P(R, e), [x3, y3] = P(r, e), [x4, y4] = P(r, s);
          a += sw;
          return (
            <path key={x.status} d={`M${x1} ${y1} A${R} ${R} 0 ${big} 1 ${x2} ${y2} L${x3} ${y3} A${r} ${r} 0 ${big} 0 ${x4} ${y4} Z`} fill={ORDER_STATUS_COLOR[x.status]}>
              <title>{`${ORDER_STATUS[x.status].label}: ${x.pct}%`}</title>
            </path>
          );
        })}
        {rows.length === 0 && <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="var(--ln)" strokeWidth={R - r} />}
        <text x={58} y={55} textAnchor="middle" fontSize={21} fontWeight={700} fill="var(--ink)">{total.toLocaleString('vi-VN')}</text>
        <text x={58} y={71} textAnchor="middle" fontSize={9.5} fill="var(--ink3)">{unit}</text>
      </svg>
      <div style={{ flex: '1 1 130px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {rows.map((x) => (
          <div key={x.status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: ORDER_STATUS_COLOR[x.status], flex: '0 0 auto' }} />
            <span style={{ flex: 1, minWidth: 0, color: 'var(--ink2)' }}>{ORDER_STATUS[x.status].label}</span>
            <b className="num">{x.pct}%</b>
          </div>
        ))}
        {rows.length === 0 && <span className="mu">Chưa có đơn hàng</span>}
      </div>
    </div>
  );
}

export function HBars({ rows, color }: { rows: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} className="hbar-row">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, marginBottom: 4 }}>
            <span style={{ color: 'var(--ink2)' }}>{r.label}</span>
            <b className="num">{r.value.toLocaleString('vi-VN')}</b>
          </div>
          <div className="mt">
            <i style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ values, color = 'var(--g6)' }: { values: number[]; color?: string }) {
  const w = 170, h = 34;
  const mn = Math.min(...values), mx = Math.max(...values), range = mx - mn || 1;
  const p = values.map((v, i) => [(i / Math.max(values.length - 1, 1)) * w, h - 2 - ((v - mn) / range) * (h - 6)] as const);
  const d = p.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={34} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={color} opacity={0.14} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} />
    </svg>
  );
}
