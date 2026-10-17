import type { Order, OrderStatus } from '@/types';
import { businessDate } from '@/utils/format';
import type { StatsService } from './types';

const dayMs = 86400000;
const sum = (rows: Order[]) => rows.reduce((n, o) => n + o.total, 0);
const quantity = (rows: Order[]) => rows.reduce((n, o) => n + o.quantity, 0);
const paid = (rows: Order[]) => rows.filter((o) => o.paymentStatus === 'success' && o.status === 'done');
const delta = (now: number, before: number) => before ? Math.round((now - before) / before * 100) : 0;
const outcomes = (rows: Order[]) => [...new Set(rows.map((o) => o.status))].map((status: OrderStatus) => ({ status, pct: rows.length ? rows.filter((o) => o.status === status).length / rows.length * 100 : 0 }));
function period(rows: Order[], days: number) {
  const end = new Date(`${businessDate(new Date())}T00:00:00+07:00`).getTime() + dayMs;
  const start = end - days * dayMs;
  const current = rows.filter((o) => Date.parse(o.placedAt) >= start && Date.parse(o.placedAt) < end);
  const previous = rows.filter((o) => Date.parse(o.placedAt) >= start - days * dayMs && Date.parse(o.placedAt) < start);
  const series = Array.from({ length: days }, (_, i) => {
    const date = businessDate(new Date(start + i * dayMs));
    return { label: date.slice(5).split('-').reverse().join('/'), value: sum(paid(current).filter((o) => businessDate(new Date(o.placedAt)) === date)) };
  });
  return { current, previous, series };
}
function group(rows: Order[], key: (o: Order) => string, value: (o: Order) => number) {
  const values = new Map<string, number>();
  for (const o of rows) values.set(key(o), (values.get(key(o)) ?? 0) + value(o));
  return [...values].map(([label, value]) => ({ label, value }));
}
export const createLiveStats = (read: () => Promise<Order[]>): StatsService => ({
  async overview(range) {
    const { current, previous, series } = period(await read(), range === 'today' ? 1 : range === '7d' ? 7 : 30);
    const revenue = paid(current), old = paid(previous);
    const hourly = Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, value: sum(revenue.filter((o) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hourCycle: 'h23' }).format(new Date(o.placedAt))) === h)) }));
    return { range, revenue: { value: sum(revenue), deltaPct: delta(sum(revenue), sum(old)) }, orders: { value: current.length, deltaPct: delta(current.length, previous.length) }, bagsSold: { value: quantity(revenue), deltaPct: delta(quantity(revenue), quantity(old)) }, series: (range === 'today' ? hourly : series).map((p) => ({ ...p, value: p.value / 1e6 })), statusShare: outcomes(current), statusTotal: current.length, rescuedBags: quantity(revenue), rescuedKg: 0 };
  },
  async revenue(range) {
    const { current, previous, series } = period(await read(), range === '7d' ? 7 : range === '30d' ? 30 : 90);
    const rows = paid(current), old = paid(previous), total = sum(rows), avgOrder = rows.length ? Math.round(total / rows.length) : 0;
    return { range, total, avgOrder, bagsSold: quantity(rows), totalDeltaPct: delta(total, sum(old)), avgDeltaPct: delta(avgOrder, old.length ? sum(old) / old.length : 0), bagsDeltaPct: delta(quantity(rows), quantity(old)), weekSeries: series.map((p) => ({ ...p, value: p.value / 1e6 })), byBag: group(rows, (o) => o.bagName, (o) => o.total / 1e6), byHour: group(rows, (o) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hourCycle: 'h23' }).format(new Date(o.placedAt)) + 'h', (o) => total ? o.total / total * 100 : 0).sort((a, b) => a.label.localeCompare(b.label)) };
  },
  async orders(range) {
    const { current } = period(await read(), range === '7d' ? 7 : 30);
    const confirmed = current.filter((o) => o.confirmedAt);
    return { range, total: current.length, completionRate: current.length ? current.filter((o) => o.status === 'done').length / current.length * 100 : 0, avgConfirmSeconds: confirmed.length ? Math.round(confirmed.reduce((n, o) => n + Math.max(0, Date.parse(o.confirmedAt!) - Date.parse(o.placedAt)), 0) / confirmed.length / 1000) : 0, outcome: outcomes(current), byWeekday: group(current, (o) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short' }).format(new Date(o.placedAt)), () => 1), failReasons: [{ label: 'Khách huỷ', value: current.filter((o) => o.status === 'cancel').length }, { label: 'Hết hạn', value: current.filter((o) => o.status === 'expired').length }] };
  },
});
