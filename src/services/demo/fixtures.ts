/**
 * DEMO DATA. Not business data: invented for the visual prototype, shaped like the reference design.
 * Everything here is only reachable through `services/demo/*`; the UI never imports this file.
 */
import type { Bag, BankAccount, Order, OrderAnalytics, OrderStatus, OverviewStats, RestaurantProfile, RevenueAnalytics, StatsRange, WalletSummary, WalletTxn, WalletTxnStatus, Withdrawal } from '@/types';
import { businessDate } from '@/utils/format';
import { feeOf } from '@/utils/wallet';

export const DEMO_PASSWORD = 'EcoBite123';
export const DEMO_PHONE = '0912345678';
/** Accepted for every phone / login / reset code in demo mode. No SMS is ever sent. */
export const DEMO_CODE = '123456';

const IMG = {
  rice: '/images/ph-rice.jpg',
  banhmi: '/images/ph-banhmi.jpg',
  bun: '/images/ph-bun.jpg',
  salad: '/images/ph-salad.jpg',
};

const ago = (now: Date, minutes: number): string => {
  const t = new Date(now.getTime() - minutes * 60000);
  // Vietnam has no DST: a fixed +07:00 offset is exact.
  const vn = new Date(t.getTime() + 7 * 3600000);
  return `${vn.toISOString().slice(0, 23)}+07:00`;
};

export const seedBags = (): Bag[] => [
  {
    id: 'bag_1', kind: 'food', category: 'Cơm', contents: [], name: 'Cơm gà xối mỡ', image: IMG.rice, status: 'live',
    description: 'Phần cơm gà còn lại cuối ca trưa, kèm canh và dưa góp.',
    originalPrice: 60000, price: 35000, quantity: 12, left: 4, perCustomerLimit: 3, repeatDays: [0, 1, 2, 3, 4, 5],
    windows: [{ start: '10:00', end: '12:00', quantity: 12 }, { start: '17:30', end: '19:00', quantity: 8 }],
  },
  {
    id: 'bag_2', kind: 'food', category: 'Bánh mì', contents: [], name: 'Bánh mì thịt nướng', image: IMG.banhmi, status: 'live',
    description: 'Bánh mì nướng trong ngày, nhân thịt và rau sống.',
    originalPrice: 45000, price: 25000, quantity: 8, left: 8, perCustomerLimit: null, repeatDays: [0, 1, 2, 3, 4, 5, 6],
    windows: [{ start: '12:00', end: '14:00', quantity: 8 }],
  },
  {
    id: 'bag_3', kind: 'food', category: 'Bún, phở', contents: [], name: 'Bún riêu cua', image: IMG.bun, status: 'live',
    description: 'Bún riêu nấu buổi sáng, nước dùng đóng riêng.',
    originalPrice: 70000, price: 40000, quantity: 5, left: 1, perCustomerLimit: 2, repeatDays: [0, 1, 2, 3, 4, 5],
    windows: [{ start: '15:00', end: '17:00', quantity: 5 }],
  },
  {
    id: 'bag_4', kind: 'food', category: 'Món khác', contents: [], name: 'Salad ức gà', image: IMG.salad, status: 'paused',
    description: 'Salad trộn trong ngày, ức gà áp chảo, sốt để riêng.',
    originalPrice: 55000, price: 30000, quantity: 6, left: 6, perCustomerLimit: null, repeatDays: [0, 1, 2, 3, 4],
    windows: [{ start: '11:00', end: '13:00', quantity: 6 }],
  },
  {
    id: 'bag_5', kind: 'bag', category: '', contents: ['Cơm gà xối mỡ', 'Bún riêu cua'], name: 'Combo cơm văn phòng', image: IMG.rice, status: 'draft',
    description: 'Cơm, món mặn, canh và tráng miệng. Soạn khi có đơn.',
    originalPrice: 80000, price: 45000, quantity: 10, left: 10, perCustomerLimit: null, repeatDays: [0, 1, 2, 3, 4],
    windows: [{ start: '17:00', end: '19:30', quantity: 10 }],
  },
  {
    id: 'bag_6', kind: 'bag', category: '', contents: ['Cơm gà xối mỡ', 'Bánh mì thịt nướng', 'Salad ức gà'], name: 'Túi bất ngờ cuối ngày', image: IMG.salad, status: 'live',
    description: 'Hai tới ba món còn lại trong ngày. Quán chọn, khách không biết trước.',
    originalPrice: 110000, price: 49000, quantity: 6, left: 6, perCustomerLimit: 2, repeatDays: [0, 1, 2, 3, 4, 5],
    windows: [{ start: '20:00', end: '21:30', quantity: 6 }],
  },
];

const OPEN = (start: string, end: string) => ({ open: true, start, end });

export const seedProfile = (): RestaurantProfile => ({
  name: 'Nhà hàng An Nhiên',
  businessType: 'Nhà hàng',
  description: 'Quán cơm nhà nấu, phục vụ trưa và tối. Cuối ngày thường còn cơm phần và món mặn, bán lại với giá bằng một nửa.',
  street: '128 Phan Tây Nhạc',
  ward: 'Xuân Phương',
  district: 'Nam Từ Liêm',
  city: 'Hà Nội',
  directions: '',
  phone: DEMO_PHONE,
  zalo: DEMO_PHONE,
  lat: 21.0462,
  lng: 105.7338,
  openingHours: [OPEN('07:00', '21:30'), OPEN('07:00', '21:30'), OPEN('07:00', '21:30'), OPEN('07:00', '21:30'), OPEN('07:00', '22:00'), OPEN('08:00', '22:00'), { open: false, start: '', end: '' }],
  // Sample account (not a real one) so the wallet can be tried end to end. The "hồ sơ chưa đủ" and
  // "chưa thể rút tiền" flows are tried with a newly registered account, whose profile starts blank.
  bank: { bankName: 'Vietcombank', accountNumber: '1900004417', accountHolder: 'NGUYEN VAN AN' },
});

export const blankProfile = (phone: string): RestaurantProfile => ({
  name: '', businessType: '', description: '', street: '', ward: '', district: '', city: '', directions: '',
  phone, zalo: '', lat: null, lng: null,
  openingHours: Array.from({ length: 7 }, (_, i) => (i === 6 ? { open: false, start: '', end: '' } : OPEN('07:00', '21:00'))),
  bank: { bankName: '', accountNumber: '', accountHolder: '' },
});

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const codeFor = (n: number): string => {
  let x = n * 7919 + 13;
  let s = '';
  for (let i = 0; i < 4; i++) {
    s += CODE_ALPHABET[x % CODE_ALPHABET.length];
    x = Math.floor(x / CODE_ALPHABET.length) + n;
  }
  return `ECO-${s}`;
};

interface Base {
  id: number; customer: string; phone: string; bag: number; qty: number;
  minutesAgo: number; window: [string, string]; status: OrderStatus; code?: string; count: number;
}

const BASE: Base[] = [
  { id: 1247, customer: 'Đặng Hoài Nam', phone: '0903 ••• 415', bag: 1, qty: 1, minutesAgo: 1, window: ['12:00', '12:30'], status: 'wait', count: 1 },
  { id: 1246, customer: 'Phan Bảo Ngọc', phone: '0981 ••• 902', bag: 5, qty: 1, minutesAgo: 3, window: ['11:00', '11:30'], status: 'wait', count: 3 },
  { id: 1245, customer: 'Nguyễn Thị Mai', phone: '0912 ••• 678', bag: 0, qty: 2, minutesAgo: 6, window: ['10:30', '11:00'], status: 'wait', count: 4 },
  { id: 1244, customer: 'Trần Văn Nam', phone: '0987 ••• 221', bag: 1, qty: 1, minutesAgo: 23, window: ['11:00', '11:30'], status: 'conf', count: 2 },
  { id: 1243, customer: 'Lê Thu Hà', phone: '0905 ••• 140', bag: 2, qty: 3, minutesAgo: 53, window: ['12:00', '12:30'], status: 'ready', code: 'ECO-8F2K', count: 7 },
  { id: 1242, customer: 'Phạm Đức Anh', phone: '0968 ••• 509', bag: 0, qty: 1, minutesAgo: 78, window: ['12:30', '13:00'], status: 'done', count: 2 },
  { id: 1241, customer: 'Hoàng Minh Châu', phone: '0934 ••• 772', bag: 3, qty: 2, minutesAgo: 108, window: ['13:00', '13:30'], status: 'cancel', count: 1 },
  { id: 1240, customer: 'Đỗ Quang Huy', phone: '0977 ••• 318', bag: 5, qty: 1, minutesAgo: 126, window: ['11:30', '12:00'], status: 'done', count: 5 },
  { id: 1239, customer: 'Vũ Khánh Linh', phone: '0918 ••• 065', bag: 1, qty: 4, minutesAgo: 148, window: ['09:00', '09:30'], status: 'done', count: 3 },
  { id: 1238, customer: 'Bùi Tiến Dũng', phone: '0942 ••• 889', bag: 0, qty: 1, minutesAgo: 160, window: ['10:00', '10:30'], status: 'miss', count: 1 },
];

const NAMES = ['Ngô Thanh Vân', 'Lê Quang Vinh', 'Trịnh Mỹ Duyên', 'Đinh Công Sơn', 'Mai Phương Thảo', 'Lý Gia Bảo', 'Cao Thị Hạnh', 'Tạ Minh Khôi'];
const WINDOWS: [string, string][] = [['10:00', '10:30'], ['11:00', '11:30'], ['12:00', '12:30'], ['17:30', '18:00'], ['18:30', '19:00']];

export const seedOrders = (bags: Bag[], now: Date = new Date()): Order[] => {
  const toOrder = (b: Base): Order => {
    const bag = bags[b.bag];
    const placedAt = ago(now, b.minutesAgo);
    const done = b.status === 'done';
    const confirmed = b.status !== 'wait' && b.status !== 'cancel';
    const readyOrBeyond = b.status === 'ready' || done || b.status === 'miss';
    return {
      id: `EB00${b.id}`, pickupCode: b.code ?? codeFor(b.id), customer: b.customer, phoneMasked: b.phone,
      bagId: bag.id, productKind: bag.kind, bagName: bag.name, image: bag.image, quantity: b.qty, unitPrice: bag.price, total: bag.price * b.qty,
      placedAt, pickupWindow: { start: b.window[0], end: b.window[1] }, status: b.status,
      confirmedAt: confirmed ? ago(now, b.minutesAgo - 3) : null,
      readyAt: readyOrBeyond ? ago(now, Math.max(b.minutesAgo - 27, 1)) : null,
      deliveredAt: done ? ago(now, Math.max(b.minutesAgo - 55, 1)) : null,
      deliveredBy: done ? 'Nguyễn Văn An' : null,
      customerOrderCount: b.count,
      revenueRecognised: b.status !== 'cancel',
    };
  };
  const extras: Base[] = Array.from({ length: 38 }, (_, i) => {
    const status: OrderStatus = i === 2 ? 'conf' : i === 5 ? 'ready' : i % 13 === 7 ? 'cancel' : i % 17 === 11 ? 'miss' : 'done';
    return {
      id: 1237 - i, customer: NAMES[i % NAMES.length], phone: `09${(10 + i * 7) % 90} ••• ${String(100 + ((i * 37) % 900))}`,
      bag: [0, 1, 2, 5, 3][i % 5], qty: 1 + (i % 3), minutesAgo: 180 + i * 95, window: WINDOWS[i % WINDOWS.length], status, count: 1 + (i % 6),
    };
  });
  return [...BASE, ...extras].map(toOrder);
};

// ---------------------------------------------------------------- stats (demo only, not computed from the orders above)

const HOURS = [1.1, 0.6, 0.3, 0.3, 0.9, 2.4, 5.2, 8.1, 9.4, 11.2, 13.6, 15.1, 18.4, 15.8, 13.9, 11.1, 9.6, 7.4, 6.2, 11.8, 13.2, 12.4, 5.1, 2.2];
const WEEK = [8.4, 9.1, 7.6, 10.2, 11.8, 13.4, 12.1];
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const lastDays = (n: number): { label: string; date: Date }[] => {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getTime() - (n - 1 - i) * 86400000);
    const dow = new Date(`${businessDate(d)}T12:00:00+07:00`).getDay();
    return { label: n <= 7 ? WEEKDAY[dow] : businessDate(d).slice(8) + '/' + businessDate(d).slice(5, 7), date: d };
  });
};

export const overviewFixture = (range: StatsRange): OverviewStats => {
  const share = (rows: [OrderStatus, number][]) => rows.map(([status, pct]) => ({ status, pct }));
  if (range === 'today') {
    return {
      range, revenue: { value: 12450000, deltaPct: 12 }, orders: { value: 48, deltaPct: 8 }, bagsSold: { value: 86, deltaPct: 15 },
      series: HOURS.map((v, i) => ({ label: `${String(i).padStart(2, '0')}:00`, value: v })),
      statusShare: share([['done', 62], ['conf', 18], ['wait', 12], ['cancel', 5], ['miss', 3]]), statusTotal: 48, rescuedBags: 86, rescuedKg: 43.2,
    };
  }
  if (range === '7d') {
    const days = lastDays(7);
    return {
      range, revenue: { value: 72800000, deltaPct: 9 }, orders: { value: 331, deltaPct: 6 }, bagsSold: { value: 602, deltaPct: 11 },
      series: days.map((d, i) => ({ label: d.label, value: WEEK[i] })),
      statusShare: share([['done', 70], ['conf', 14], ['wait', 8], ['cancel', 5], ['miss', 3]]), statusTotal: 331, rescuedBags: 602, rescuedKg: 301,
    };
  }
  const days = lastDays(30);
  return {
    range, revenue: { value: 312800000, deltaPct: 9 }, orders: { value: 1412, deltaPct: 7 }, bagsSold: { value: 2184, deltaPct: 11 },
    series: days.map((d, i) => ({ label: d.label, value: Math.round((9 + 4 * Math.sin(i / 2.3) + (i % 7 === 5 ? 3 : 0)) * 10) / 10 })),
    statusShare: share([['done', 91], ['cancel', 6], ['miss', 3]]), statusTotal: 1412, rescuedBags: 2184, rescuedKg: 1092,
  };
};

export const revenueFixture = (range: RevenueAnalytics['range']): RevenueAnalytics => {
  const k = range === '7d' ? 0.23 : range === 'quarter' ? 3 : 1;
  const days = lastDays(7);
  return {
    range, total: Math.round(312800000 * k), avgOrder: 41200, bagsSold: Math.round(2184 * k), totalDeltaPct: 9, avgDeltaPct: 3, bagsDeltaPct: 11,
    weekSeries: days.map((d, i) => ({ label: d.label, value: WEEK[i] })),
    byBag: [['Cơm gà xối mỡ', 128], ['Bún riêu cua', 86], ['Bánh mì thịt nướng', 61], ['Salad ức gà', 38]].map(([label, v]) => ({ label: label as string, value: Math.round((v as number) * k) })),
    byHour: [{ label: '11:00 – 13:00 · trưa', value: 38 }, { label: '17:00 – 19:00 · tối', value: 31 }, { label: '19:00 – 21:00 · tối muộn', value: 18 }, { label: '07:00 – 09:00 · sáng', value: 13 }],
  };
};

export const orderAnalyticsFixture = (range: OrderAnalytics['range']): OrderAnalytics => {
  const k = range === '7d' ? 0.23 : 1;
  return {
    range, total: Math.round(1412 * k), completionRate: 91.4, avgConfirmSeconds: 260,
    outcome: [{ status: 'done', pct: 91 }, { status: 'cancel', pct: 6 }, { status: 'miss', pct: 3 }],
    byWeekday: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label, i) => ({ label, value: Math.round([41, 44, 38, 49, 58, 67, 52][i] * k) })),
    failReasons: [{ label: 'Khách huỷ trước giờ nhận', value: 54 }, { label: 'Khách không tới lấy', value: 38 }, { label: 'Quán hết suất trước khi khách tới', value: 22 }, { label: 'Lý do khác', value: 13 }],
  };
};

// ---------------------------------------------------------------- wallet

export interface WalletSeed {
  available: number;
  holding: number;
  txns: WalletTxn[];
  withdrawals: Withdrawal[];
  period: WalletSummary['period'];
}

export const blankWallet = (): WalletSeed => ({
  available: 0,
  holding: 0,
  txns: [],
  withdrawals: [],
  period: { from: '01/10', to: '14/10', moneyIn: 0, moneyOut: 0, withdrawals: 0, fee: 0 },
});

/** Same sample numbers as the design (group 6). They are fixed demo data, not derived from the sample orders. */
export const seedWallet = (bank: BankAccount): WalletSeed => {
  const at = (day: string, time: string) => `2026-10-${day}T${time}:00.000+07:00`;
  const out = (id: string, day: string, time: string, code: string, amount: number, status: WalletTxnStatus): WalletTxn => ({
    id, at: at(day, time), kind: 'out', title: 'Rút về Vietcombank •••• 4417', code, amount, status,
  });
  const inn = (id: string, day: string, time: string, code: string, title: string, amount: number, status: WalletTxnStatus): WalletTxn => ({
    id, at: at(day, time), kind: 'in', title: `Đơn #${code} · ${title}`, code, amount, status,
  });
  const wd = (code: string, day: string, time: string, amount: number, status: Withdrawal['status'], balanceBefore: number): Withdrawal => ({
    code, amount, fee: feeOf(amount), net: amount - feeOf(amount), status, createdAt: at(day, time), verifiedAt: at(day, time), balanceBefore, bank,
  });
  return {
    available: 8_420_000,
    holding: 2_130_000,
    txns: [
      out('wt_1', '14', '09:12', 'RT250014', 3_000_000, 'outp'),
      inn('wt_2', '13', '21:40', 'EB001244', 'Túi bất ngờ cuối ngày', 98_000, 'in'),
      inn('wt_3', '13', '20:05', 'EB001243', 'Cơm gà xối mỡ', 35_000, 'in'),
      inn('wt_4', '13', '13:36', 'EB001240', 'Túi bất ngờ buổi trưa', 39_000, 'hold'),
      out('wt_5', '12', '16:20', 'RT250013', 5_000_000, 'outd'),
      inn('wt_6', '12', '11:08', 'EB001231', 'Túi bất ngờ cuối ngày', 98_000, 'in'),
      out('wt_7', '11', '18:44', 'RT250012', 2_000_000, 'fail'),
    ],
    withdrawals: [
      wd('RT250014', '14', '09:12', 3_000_000, 'processing', 11_420_000),
      wd('RT250013', '12', '16:20', 5_000_000, 'done', 13_420_000),
      wd('RT250012', '11', '18:44', 2_000_000, 'failed', 15_420_000),
    ],
    period: { from: '01/10', to: '14/10', moneyIn: 14_980_000, moneyOut: 8_000_000, withdrawals: 2, fee: 800_000 },
  };
};
