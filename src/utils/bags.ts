import type { Bag, BagWindow } from '@/types';
import { businessDate, businessTime, minutesOf } from './format';

/** 0 = Monday … 6 = Sunday, in Vietnam time. */
export const businessWeekday = (d: Date = new Date()): number => (new Date(`${businessDate(d)}T12:00:00+07:00`).getDay() + 6) % 7;

export const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Dish groups for regular food products. */
export const FOOD_CATEGORIES = ['Cơm', 'Bún, phở', 'Bánh mì', 'Món chay', 'Đồ uống', 'Tráng miệng', 'Món khác'];

export const PRODUCT_KIND_LABEL = { food: 'Đồ ăn', bag: 'Mystery Bag' } as const;

export const durationLabel = (minutes: number): string => {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
};

export const totalSeats = (b: Pick<Bag, 'windows'>): number => b.windows.reduce((s, w) => s + w.quantity, 0);

export interface BagTiming {
  /** The window that is open now, else the next one today, else null. */
  window: BagWindow | null;
  open: boolean;
  /** Minutes until the open window ends. */
  minutesLeft: number | null;
}

export function bagTiming(bag: Bag, now: Date = new Date()): BagTiming {
  if (!bag.repeatDays.includes(businessWeekday(now))) return { window: null, open: false, minutesLeft: null };
  const cur = minutesOf(businessTime(now));
  const sorted = [...bag.windows].sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
  const open = sorted.find((w) => minutesOf(w.start) <= cur && cur < minutesOf(w.end));
  if (open) return { window: open, open: true, minutesLeft: minutesOf(open.end) - cur };
  return { window: sorted.find((w) => minutesOf(w.start) > cur) ?? null, open: false, minutesLeft: null };
}

/** Live bags that stop selling within `withinMinutes` or have few seats left. Most urgent first. */
export function expiringBags(bags: Bag[], now: Date = new Date(), withinMinutes = 180): { bag: Bag; timing: BagTiming }[] {
  return bags
    .filter((b) => b.status === 'live')
    .map((bag) => ({ bag, timing: bagTiming(bag, now) }))
    .filter(({ bag, timing }) => (timing.open && (timing.minutesLeft ?? Infinity) <= withinMinutes) || (timing.open && bag.left <= 2))
    .sort((a, b) => (a.timing.minutesLeft ?? Infinity) - (b.timing.minutesLeft ?? Infinity));
}
