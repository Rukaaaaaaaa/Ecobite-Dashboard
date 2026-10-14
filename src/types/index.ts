/**
 * Dashboard domain types.
 *
 * Order statuses follow the reference design. The real backend lifecycle is
 * placed → paid → preparing → ready → qr_verified → picked_up (+ cancelled / expired).
 * The mapping below is a PROPOSAL waiting for backend confirmation, nothing is wired to it yet:
 *   wait   ≈ paid           (customer paid, restaurant has not acted)
 *   conf   ≈ preparing
 *   ready  ≈ ready
 *   done   ≈ qr_verified / picked_up
 *   cancel ≈ cancelled      miss ≈ no backend equivalent yet
 */
export type OrderStatus = 'wait' | 'conf' | 'ready' | 'done' | 'miss' | 'cancel';

export interface TimeWindow {
  start: string; // 'HH:mm'
  end: string;
}

export interface Order {
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
