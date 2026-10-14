import type { StatsService } from '../types';
import { delay, demoDb } from './db';
import { orderAnalyticsFixture, overviewFixture, revenueFixture } from './fixtures';

/** Demo numbers only. A new account (no orders yet) gets zeros instead of the sample figures. */
const isSample = (): boolean => demoDb.requireSession().id === 'acc_demo';

export const demoStats: StatsService = {
  async overview(range) {
    await delay();
    const s = overviewFixture(range);
    if (isSample()) return s;
    return {
      ...s, revenue: { value: 0, deltaPct: null }, orders: { value: 0, deltaPct: null }, bagsSold: { value: 0, deltaPct: null },
      series: s.series.map((p) => ({ ...p, value: 0 })), statusShare: [], statusTotal: 0, rescuedBags: 0, rescuedKg: 0,
    };
  },
  async revenue(range) {
    await delay();
    const r = revenueFixture(range);
    return isSample() ? r : { ...r, total: 0, avgOrder: 0, bagsSold: 0, weekSeries: r.weekSeries.map((p) => ({ ...p, value: 0 })), byBag: [], byHour: [] };
  },
  async orders(range) {
    await delay();
    const r = orderAnalyticsFixture(range);
    return isSample() ? r : { ...r, total: 0, completionRate: 0, avgConfirmSeconds: 0, outcome: [], byWeekday: r.byWeekday.map((p) => ({ ...p, value: 0 })), failReasons: [] };
  },
};
