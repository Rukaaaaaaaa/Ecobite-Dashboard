/**
 * Dashboard domain types.
 *
 * Order statuses follow the reference design. The real backend lifecycle is
 * placed → paid → preparing → ready → qr_verified → picked_up (+ cancelled / expired).
 * Live mapping (services/live.ts): unpaid = placed, wait = paid (also confirmed cash),
 * conf = preparing, ready = ready, verified = qr_verified, done = picked_up,
 * cancel = cancelled, expired = expired. "miss" exists only in the original demo.
 */
export type OrderStatus = 'unpaid' | 'wait' | 'conf' | 'ready' | 'verified' | 'done' | 'miss' | 'cancel' | 'expired';

export interface TimeWindow {
  start: string; // 'HH:mm'
  end: string;
}

export interface Order {
  orderCode?: string;
  backendStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  items?: { foodBagId: string; name: string; quantity: number; unitPrice: number; ownBox: boolean }[];
  money?: { subtotal: number; promoDiscount: number; ownBoxDiscount: number; total: number };
  id: string; // 'EB001245'
  /** Code the customer shows at pickup (manual entry in "Xác minh mã nhận hàng"). */
  pickupCode: string;
  customer: string;
  /** Already masked: the dashboard never receives a full phone number before pickup. */
  phoneMasked: string;
  bagId: string;
  /** Lets the order list tell dishes from Mystery Bags. */
  productKind: ProductKind;
  bagName: string;
  image: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** ISO-8601 with +07:00. */
  placedAt: string;
  pickupWindow: TimeWindow;
  status: OrderStatus;
  confirmedAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  deliveredBy: string | null;
  customerOrderCount: number;
  /** Counted as revenue (customers who never came still paid). */
  revenueRecognised: boolean;
}

export type BagStatus = 'draft' | 'live' | 'paused';

/** A product is either a specific dish (`food`) or a surprise `bag` (Mystery Bag). */
export type ProductKind = 'food' | 'bag';

export interface BagWindow extends TimeWindow {
  quantity: number;
}

/** Despite the name, `Bag` is any sellable product (see `kind`); the name is kept so existing services keep working. */
export interface Bag {
  id: string;
  kind: ProductKind;
  /** Dish group, food only (e.g. "Cơm"). Empty for a Mystery Bag. */
  category: string;
  /** Internal list of dishes that may go into the bag, Mystery Bag only. Customers never see it. */
  contents: string[];
  name: string;
  description: string;
  image: string; // url or data: url (own photo)
  originalPrice: number;
  price: number;
  /** Default seats offered when a new time window is added. */
  quantity: number;
  /** Seats still available in the current window. */
  left: number;
  perCustomerLimit: number | null;
  status: BagStatus;
  windows: BagWindow[];
  /** 0 = Monday … 6 = Sunday. */
  repeatDays: number[];
}

export type BagInput = Omit<Bag, 'id' | 'left'>;

export interface OpeningDay {
  open: boolean;
  start: string;
  end: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface RestaurantProfile {
  name: string;
  businessType: string;
  description: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  directions: string;
  phone: string;
  /** Optional Zalo number. */
  zalo: string;
  lat: number | null;
  lng: number | null;
  /** 0 = Monday … 6 = Sunday. */
  openingHours: OpeningDay[];
  bank: BankAccount;
}

export interface Account {
  id: string;
  fullName: string;
  /** Local form, 0xxxxxxxxx. The phone number is the account identifier (no email anywhere). */
  phone: string;
  phoneVerified: boolean;
  /** Whether signing in with an SMS code is allowed besides the password. */
  otpLogin: boolean;
  role: 'owner';
}

export interface ProfileCheck {
  key: string;
  label: string;
  done: boolean;
  /** Where the missing piece is filled in. */
  to: string;
}

export interface ProfileCompleteness {
  filled: number;
  total: number;
  missing: ProfileCheck[];
  /** Required fields + verified phone: what products need before they go on sale. */
  canPublish: boolean;
  checks: ProfileCheck[];
}

export type StatsRange = 'today' | '7d' | '30d';

export interface Kpi {
  value: number;
  /** % change against the previous period; null for "needs attention" tiles. */
  deltaPct: number | null;
}

export interface OverviewStats {
  range: StatsRange;
  revenue: Kpi;
  orders: Kpi;
  bagsSold: Kpi;
  series: { label: string; value: number }[];
  /** `series.value` is in millions of VND. */
  statusShare: { status: OrderStatus; pct: number }[];
  statusTotal: number;
  rescuedBags: number;
  rescuedKg: number;
}

export interface RevenueAnalytics {
  range: '7d' | '30d' | 'quarter';
  total: number;
  avgOrder: number;
  bagsSold: number;
  totalDeltaPct: number;
  avgDeltaPct: number;
  bagsDeltaPct: number;
  weekSeries: { label: string; value: number }[];
  byBag: { label: string; value: number }[];
  byHour: { label: string; value: number }[];
}

export interface OrderAnalytics {
  range: '7d' | '30d';
  total: number;
  completionRate: number;
  avgConfirmSeconds: number;
  outcome: { status: OrderStatus; pct: number }[];
  byWeekday: { label: string; value: number }[];
  failReasons: { label: string; value: number }[];
}

export interface VerifyResult {
  order: Order;
}

// ---------------------------------------------------------------- wallet (group 6 of the design)

/** in = money in; hold = paid by the customer but the order is not finished; outp = withdrawal processing; outd = transferred; fail = not successful. */
export type WalletTxnStatus = 'in' | 'hold' | 'outp' | 'outd' | 'fail';

export interface WalletTxn {
  id: string;
  /** ISO-8601 with +07:00. */
  at: string;
  kind: 'in' | 'out';
  title: string;
  /** Order id (`EB001244`) for money in, withdrawal code (`RT250014`) for money out. */
  code: string;
  /** Always positive; `kind` gives the direction. For a withdrawal this is the amount taken out of the wallet, before the platform fee. */
  amount: number;
  status: WalletTxnStatus;
}

export interface WalletSummary {
  available: number;
  /** Paid by customers, orders not finished yet. */
  holding: number;
  /** The linked bank account, or null while it is not complete (withdrawing is blocked). */
  bank: BankAccount | null;
  lastWithdrawal: { code: string; status: WalletTxnStatus } | null;
  /** Totals of the reporting period shown on the history screen. */
  period: { from: string; to: string; moneyIn: number; moneyOut: number; withdrawals: number; fee: number };
}

export type WithdrawalStatus = 'awaiting_otp' | 'processing' | 'done' | 'failed';

export interface Withdrawal {
  code: string;
  /** Taken out of the wallet. */
  amount: number;
  fee: number;
  /** What the bank receives (`amount - fee`). */
  net: number;
  status: WithdrawalStatus;
  createdAt: string;
  verifiedAt: string | null;
  /** Wallet balance just before this withdrawal. */
  balanceBefore: number;
  /** Snapshot of the destination at creation time. */
  bank: BankAccount;
}
