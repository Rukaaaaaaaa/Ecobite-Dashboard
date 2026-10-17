import type {
  Account,
  Bag,
  BagInput,
  BagStatus,
  BankAccount,
  Order,
  OrderAnalytics,
  OrderStatus,
  OverviewStats,
  ProfileCompleteness,
  RestaurantProfile,
  RevenueAnalytics,
  StatsRange,
  WalletSummary,
  WalletTxn,
  Withdrawal,
} from '@/types';

/** Error thrown by every service. `code` is machine readable, `message` is shown to the user (Vietnamese). */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly extra?: { attemptsLeft?: number; retryAfterSeconds?: number },
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RegisterInput {
  fullName: string;
  phone: string;
  password: string;
  restaurantName?: string;
  address?: string;
}

/**
 * Contracts the UI depends on. The demo implementations live in `services/demo`.
 * A real HTTP implementation replaces them one by one once the backend has the endpoint
 * (see README, "API còn thiếu"). The UI never imports the demo folder directly.
 */
export interface AuthService {
  getSession(): Account | null;
  /** The phone number is the account identifier. */
  login(phone: string, password: string): Promise<Account>;
  requestPhoneLoginCode(phone: string): Promise<{ resendAfterSeconds: number }>;
  loginWithPhoneCode(phone: string, code: string): Promise<Account>;
  register(input: RegisterInput): Promise<Account>;
  sendPhoneCode(phone?: string): Promise<{ resendAfterSeconds: number }>;
  verifyPhoneCode(code: string): Promise<Account>;
  /** Password reset, step 1: send a code to the phone (same answer for unknown numbers). */
  requestPasswordReset(phone: string): Promise<{ resendAfterSeconds: number }>;
  /** Step 2: check the code, get a one-time token for step 3. */
  verifyPasswordResetCode(phone: string, code: string): Promise<{ token: string }>;
  resetPassword(token: string, password: string): Promise<void>;
  changePassword(current: string, next: string): Promise<void>;
  /** Turn "sign in with an SMS code" on or off for the signed-in account. */
  setOtpLogin(enabled: boolean): Promise<Account>;
  logout(): Promise<void>;
}

export interface OrderListQuery {
  search?: string;
  status?: OrderStatus | 'all';
  /** Only orders finished (done / miss / cancel). */
  finishedOnly?: boolean;
  /** Only orders still waiting for an action from the restaurant. */
  actionableOnly?: boolean;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderListResult {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  /** Count per status over the whole (unfiltered by status) result, for the filter chips. */
  counts: Record<OrderStatus | 'all', number>;
}

export interface OrdersService {
  list(query: OrderListQuery): Promise<OrderListResult>;
  get(id: string): Promise<Order>;
  /** wait → conf, conf → ready. Anything else is rejected. */
  advance(id: string, expectedStatus?: string): Promise<Order>;
  /** Manual or scanned code. */
  lookupPickupCode(code: string): Promise<Order>;
  /** ready → done for an order found by `lookupPickupCode`. */
  completePickup(id: string): Promise<Order>;
  recentDeliveries(): Promise<Order[]>;
  pendingCount(): Promise<number>;
}

export interface BagsService {
  list(): Promise<Bag[]>;
  get(id: string): Promise<Bag>;
  create(input: BagInput): Promise<Bag>;
  update(id: string, input: BagInput): Promise<Bag>;
  /** Publishing is refused with `profile_incomplete` while the profile is not complete. */
  setStatus(id: string, status: BagStatus): Promise<Bag>;
}

export interface ProfileService {
  get(): Promise<RestaurantProfile>;
  update(patch: Partial<Omit<RestaurantProfile, 'bank'>>): Promise<RestaurantProfile>;
  updateBank(bank: BankAccount): Promise<RestaurantProfile>;
  completeness(): Promise<ProfileCompleteness>;
}

export interface StatsService {
  overview(range: StatsRange): Promise<OverviewStats>;
  revenue(range: RevenueAnalytics['range']): Promise<RevenueAnalytics>;
  orders(range: OrderAnalytics['range']): Promise<OrderAnalytics>;
}

export interface WalletService {
  summary(): Promise<WalletSummary>;
  /** Newest first. */
  transactions(): Promise<WalletTxn[]>;
  /** Creates a withdrawal waiting for its OTP; nothing leaves the wallet yet. Rejected without a complete bank account. */
  startWithdrawal(amount: number): Promise<Withdrawal>;
  getWithdrawal(code: string): Promise<Withdrawal>;
  /** Sends the six-digit code to the owner's phone. */
  sendWithdrawalCode(code: string): Promise<{ resendAfterSeconds: number }>;
  /** Checks the code, then takes the money out of the wallet and starts processing. */
  confirmWithdrawal(code: string, otp: string): Promise<Withdrawal>;
}

export interface Services {
  /** True while every service is the in-memory demo. Drives the "dữ liệu mẫu" labelling. */
  demo: boolean;
  auth: AuthService;
  orders: OrdersService;
  bags: BagsService;
  profile: ProfileService;
  stats: StatsService;
  wallet: WalletService;
}
