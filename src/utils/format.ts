export const BUSINESS_TZ = 'Asia/Ho_Chi_Minh';

export const vnd = (n: number): string => `${n.toLocaleString('vi-VN')}đ`;

/** Millions of VND, one decimal at most. */
export const million = (n: number): string => `${n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`;

const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: BUSINESS_TZ, hour: '2-digit', minute: '2-digit', hour12: false });

/** `YYYY-MM-DD` in Vietnam time. */
export const businessDate = (d: Date = new Date()): string => dateFmt.format(d);

/** `HH:mm` in Vietnam time. */
export const businessTime = (iso: string | Date): string => timeFmt.format(typeof iso === 'string' ? new Date(iso) : iso);

/** `DD/MM` from an ISO string or Date. */
export const shortDate = (iso: string | Date): string => {
  const [, m, d] = businessDate(typeof iso === 'string' ? new Date(iso) : iso).split('-');
  return `${d}/${m}`;
};

/** `DD/MM/YYYY` for today. */
export const longDate = (d: Date = new Date()): string => {
  const [y, m, day] = businessDate(d).split('-');
  return `${day}/${m}/${y}`;
};

export const timeAgoMinutes = (iso: string, now: Date = new Date()): number =>
  Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));

export const windowLabel = (w: { start: string; end: string }): string => `${w.start} – ${w.end}`;

export const discountPct = (original: number, price: number): number =>
  original > 0 ? Math.max(0, Math.round((1 - price / original) * 100)) : 0;

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} phút ${s} giây`;
};

export const digitsOnly = (s: string): string => s.replace(/\D/g, '');

/** Vietnamese mobile: 10 digits starting with 0, +84 / 84 followed by 9 digits, or just the 9 digits after the +84 prefix. Returns the 0xxxxxxxxx form or null. */
export const normalizePhone = (s: string): string | null => {
  const d = digitsOnly(s);
  const local = d.startsWith('84') && d.length === 11 ? `0${d.slice(2)}` : d.length === 9 ? `0${d}` : d;
  return /^0[35789]\d{8}$/.test(local) ? local : null;
};

export const formatPhone = (local: string): string => `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;

export const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Safe in-app redirect target: same-origin path only. */
export const safeReturnTo = (value: string | null | undefined): string | null =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : null;
